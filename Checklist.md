# 📋 InfyBite Project Remediation & Quality Checklist

> **Purpose:** This document serves as the master tracking and verification checklist for resolving security vulnerabilities, concurrency deadlocks, data integrity flaws, and architectural limitations across the InfyBite ecosystem.  
> **Status Conventions:**  
> - `[ ] PENDING` — Analyzed, ready for implementation  
> - `[⏳] DEFERRED` — Intentionally paused (e.g. WebSocket modifications per project requirements)  
> - `[🔄] IN PROGRESS` — Currently being addressed  
> - `[x] VERIFIED` — Implemented and verified with automated/manual tests  

---

## 📑 Quick Navigation
1. [Phase 1: Critical Security Vulnerabilities](#phase-1-critical-security-vulnerabilities)
2. [Phase 2: Concurrency & Real-Time Stability](#phase-2-concurrency--real-time-stability)
3. [Phase 3: Database & Backend Data Integrity](#phase-3-database--backend-data-integrity)
4. [Phase 4: Frontend State, Auth & UX Stability](#phase-4-frontend-state-auth--ux-stability)
5. [Phase 5: Code Quality & Clean Architecture](#phase-5-code-quality--clean-architecture)
6. [Phase 6: DevOps, Testing & Tooling](#phase-6-devops-testing--tooling)

---

## Phase 1: Critical Security Vulnerabilities

### [ ] SEC-01: Fix JWT Secret Initialization Race (Zero-Entropy Tokens)
* **Severity:** Critical
* **Files Involved:**
  - `server/internal/utils/jwt.go` (Lines 10–13)
  - `server/cmd/main.go` (Lines 22–30)
* **Root Cause:**
  In Go, package-level `var` blocks evaluate before `main()` starts. In `jwt.go`, `accessSecret = []byte(os.Getenv("ACCESS_SECRET"))` runs before `godotenv.Load()` is called in `main.go`. Unless the environment variable was exported in the host terminal shell, `accessSecret` and `refreshSecret` evaluate to `""` (empty string). Both token generation and token validation use the same empty secret, meaning tokens worked in development, but any external attacker could sign arbitrary admin tokens with an empty key.
* **Proposed Fix:**
  Replace static package variables with dynamic secret retrieval or an explicit config initialization function called **after** `godotenv.Load()`.
  ```go
  // In server/internal/utils/jwt.go
  func getAccessSecret() []byte {
      secret := os.Getenv("ACCESS_SECRET")
      if secret == "" {
          log.Fatal("CRITICAL: ACCESS_SECRET environment variable is not set")
      }
      return []byte(secret)
  }
  ```
* **Verification Steps:**
  1. Add a test in `jwt_test.go` verifying that generating a token without `ACCESS_SECRET` set causes an error or uses the loaded `.env` value.
  2. Attempt to sign a token with secret `""` and ensure `ValidateToken` rejects it.
  3. Verify login and access to protected routes continue to succeed with valid secrets.

---

### [ ] SEC-02: Prevent Privilege Hijacking in `AddManager`
* **Severity:** High
* **Files Involved:**
  - `server/internal/controllers/vendor_controller.go` (Lines 1583–1594)
* **Root Cause:**
  When assigning a user as manager, the handler updates `users.role` to `"manager"` for any arbitrary `userId` without validating the user's current role. A vendor can submit an `admin` or rival `vendor`'s user ID and demote them to a manager.
* **Proposed Fix:**
  Add a strict condition that the target user's current role must be `"user"`.
  ```go
  result, err := collections.users.UpdateOne(
      ctx,
      bson.M{"_id": managerData.UserID, "role": "user"},
      bson.M{"$set": bson.M{
          "role":      "manager",
          "updatedAt": primitive.NewDateTimeFromTime(time.Now()),
      }},
  )
  if err != nil || result.MatchedCount == 0 {
      utils.RespondError(c, http.StatusBadRequest, "Target user not found or is not eligible to become a manager (must currently have 'user' role)")
      return
  }
  ```
* **Verification Steps:**
  1. Create an admin user and attempt to pass their ID to `POST /api/v1/vendor/managers` from a vendor account. Verify the request is rejected with 400 Bad Request.
  2. Create a standard `"user"` account and pass their ID. Verify the user is successfully promoted to `"manager"`.

---

### [⏳] SEC-03: WebSocket Token Leakage via Query String
* **Severity:** Medium
* **Files Involved:**
  - `server/internal/handlers/websocket.go` (Line 49)
  - `client/src/hooks/useWebsocket.ts` (Line 60)
* **Status:** `DEFERRED` (Do not touch WebSocket code at this stage per user directive).
* **Root Cause:**
  JWT passed in `GET /api/v1/ws?token=...` is exposed in web server access logs, reverse-proxy logs, browser history, and proxy headers.
* **Future Fix Plan:**
  Switch to cookie-based upgrade authentication (`c.Cookie("refresh_token")`) or a short-lived, single-use ticket mechanism (`POST /api/v1/ws/ticket` -> `/ws?ticket=UUID`).
* **Verification Steps:**
  Verify WebSocket connects without passing JWT in query string once implemented.

---

### [ ] SEC-04: Enforce JWT Signing Algorithm Verification
* **Severity:** Medium
* **Files Involved:**
  - `server/internal/utils/jwt.go` (Lines 49–86)
* **Root Cause:**
  `jwt.ParseWithClaims` accepts any signing method returned by the token header. Missing an explicit HMAC check permits algorithm downgrade attacks (e.g. `alg: "none"` or asymmetric public key confusion).
* **Proposed Fix:**
  Add a type-assertion check for `*jwt.SigningMethodHMAC` inside the key callback:
  ```go
  token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
      if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
          return nil, fmt.Errorf("unexpected signing algorithm: %v", token.Header["alg"])
      }
      return secret, nil
  })
  ```
* **Verification Steps:**
  1. Craft a test JWT with `alg: "none"` and ensure `ValidateToken` returns an error.
  2. Craft a test JWT with valid HMAC-SHA256 and ensure it parses successfully.

---

### [ ] SEC-05: Prevent Regular Expression Denial of Service (ReDoS)
* **Severity:** High
* **Files Involved:**
  - `server/internal/controllers/admin_controller.go` (Lines 37–45, Lines 387–409)
* **Root Cause:**
  Search queries from `c.Query("email")` and `c.Query("name")` are injected directly into MongoDB `$regex` without escaping special regex characters. Attackers can supply catastrophic backtracking expressions (e.g. `(a+)+$`) that lock CPU cores and stall MongoDB.
* **Proposed Fix:**
  Wrap user inputs with `regexp.QuoteMeta()` before passing to `$regex`:
  ```go
  import "regexp"

  if searchEmail != "" {
      filter["email"] = bson.M{
          "$regex":   regexp.QuoteMeta(searchEmail),
          "$options": "i",
      }
  }
  ```
* **Verification Steps:**
  1. Send a query parameter containing regex special characters: `GET /api/v1/admin/users?email=test+user(1)`.
  2. Verify the server does not panic or perform regex syntax execution, and treats `+` and `()` as literal characters.

---

### [ ] SEC-06: Implement Rate Limiting on Authentication & Sensitive Endpoints
* **Severity:** High
* **Files Involved:**
  - `server/internal/middlewares/ratelimit.go` (New File)
  - `server/routes/auth_routes.go`
* **Root Cause:**
  No rate limiting exists on `/auth/login`, `/auth/register`, `/auth/refresh`, or status update endpoints, leaving them open to brute-force credential stuffing and denial of service.
* **Proposed Fix:**
  Create an in-memory IP token-bucket rate limiter middleware using `golang.org/x/time/rate`:
  - Login/Register: Limit to 5 attempts per minute per IP.
  - Refresh: Limit to 20 requests per minute per IP.
* **Verification Steps:**
  1. Send 6 rapid requests to `POST /api/v1/auth/login`.
  2. Confirm the 6th request receives HTTP 429 Too Many Requests with a `Retry-After` header.

---

## Phase 2: Concurrency & Real-Time Stability

### [⏳] CONC-01: Resolve WebSocket Hub Self-Deadlock
* **Severity:** Critical
* **Files Involved:**
  - `server/internal/websocket/hub.go` (Lines 44–60)
* **Status:** `DEFERRED` (WebSocket-related, parked for later implementation per user request).
* **Root Cause:**
  Inside `h.Run()`, the broadcast loop tries to send a slow client to `h.Unregister`. Because `h.Unregister` is unbuffered and serviced by the exact same goroutine, sending blocks indefinitely, freezing the entire hub.
* **Future Fix Plan:**
  Remove the channel self-send. Evict slow clients directly within the hub map iteration:
  ```go
  default:
      log.Printf("Removing slow client: %s", client.ID)
      delete(h.Clients, client)
      client.SafeClose()
  ```
* **Verification Steps:**
  Simulate 100 concurrent clients where 5 have artificial latency. Verify the hub continues processing messages for active clients without hanging.

---

### [⏳] CONC-02: Implement WebSocket Pub/Sub Topic Rooms
* **Severity:** Medium
* **Files Involved:**
  - `server/internal/utils/broadcast.go`
  - `server/internal/websocket/hub.go`
* **Status:** `DEFERRED` (WebSocket-related, parked for later implementation per user request).
* **Root Cause:**
  All updates are broadcast globally to every connected user regardless of food court, vendor, or role.
* **Future Fix Plan:**
  Add room subscription logic (e.g., `foodcourt:{id}` channels).

---

### [x] CONC-03: Eliminate Frontend REST Query Storms (Thundering Herd)
* **Severity:** High
* **Status:** `VERIFIED`
* **Files Involved:**
  - `client/src/pages/manager/MultipleItemManagement.tsx` (Lines 104–135)
  - `client/src/pages/manager/ItemManagement.tsx` (Lines 97–180)
  - `client/src/pages/user/FoodCourtDetails.tsx` (Lines 125–150)
* **Root Cause:**
  When receiving a real-time WebSocket update, manager pages fired full HTTP REST queries (`GET /manager/vendor-items` or `GET /manager/items/:id`) instead of updating local React state immutably.
* **Resolution:**
  1. Replaced REST refetch calls in `MultipleItemManagement.tsx` with immutable in-memory state updates matching the updated item and food court.
  2. Implemented granular in-memory state transformations in `ItemManagement.tsx` for create, update, and delete actions, eliminating HTTP refetches.
  3. Added food court ID isolation in `FoodCourtDetails.tsx` to prevent cross-foodcourt state pollution.
* **Verification Results:**
  - TypeScript compilation and Vite production build passed cleanly (`npm run build` exit 0).
  - Network tab confirms zero outbound REST requests are triggered upon receiving real-time WebSocket broadcast updates.

---

### [⏳] CONC-04: Fix Single `lastMessage` Overwrite Pattern
* **Severity:** Medium
* **Files Involved:**
  - `client/src/hooks/useWebsocket.ts`
  - `client/src/context/WebsocketProvider.tsx`
* **Status:** `DEFERRED` (WebSocket-related, parked for later implementation per user request).
* **Root Cause:**
  Storing only the latest message in React state causes messages that arrive in the same render tick to be dropped.
* **Future Fix Plan:**
  Implement an event-listener subscription registry (`on('event_name', callback)`).

---

## Phase 3: Database & Backend Data Integrity

### [x] DB-01: Correct BSON Field Name Mismatch (`userId` vs `user_id`)
* **Severity:** High
* **Status:** `VERIFIED`
* **Files Involved:**
  - `server/internal/controllers/admin_controller.go` (Line 172, Line 456)
  - `server/internal/models/vendor.go` (Line 11)
* **Root Cause:**
  `models.Vendor` stores the user reference under BSON field `user_id`. In `admin_controller.go`, `MakeUser` (demoting a vendor) and `GetAllVendors` queried `bson.M{"userId": ...}` with camelCase. Because MongoDB did not match `"userId"`, `GetAllVendors` silently omitted `shopName` and `vendorId`, and `MakeUser` failed to delete the vendor profile upon demotion.
* **Resolution:**
  Updated both queries to use `bson.M{"user_id": ...}` with request context propagation.
* **Verification Results:**
  - Compilation passed cleanly (`go vet ./...` exit 0).
  - `GetAllVendors` successfully populates `shopName` and `vendorId`.
  - `MakeUser` deletes the vendor profile document cleanly.

---

### [x] DB-02: Fix Wrong Collection Name in `DeleteFoodCourt`
* **Severity:** High
* **Status:** `VERIFIED`
* **Files Involved:**
  - `server/internal/controllers/admin_controller.go` (Line 914)
* **Root Cause:**
  `DeleteFoodCourt` targeted `db.Collection("item_foodcourts")` with an underscore, while the rest of the application uses `"itemfoodcourts"`. Items associated with deleted food courts remained orphaned in the database.
* **Resolution:**
  Changed collection reference to `"itemfoodcourts"` and passed request context `c.Request.Context()`.
* **Verification Results:**
  - Server compiled cleanly (`go vet ./...` exit 0).
  - Deleting a food court cascades cleanly, deleting both the food court record, its managers, and its assigned items from `itemfoodcourts`.

---

### [x] VERIFIED: DB-03: Enforce Payload Validation with `utils.Validate.Struct()`
* **Severity:** High
* **Files Involved:**
  - `server/internal/controllers/vendor_controller.go` (UpdateVendorProfile, CreateItem, UpdateItem, CreateFoodCourtItem, UpdateFoodCourtItem, UpdateManager)
  - `server/internal/controllers/manager_controller.go` (UpdateFoodCourtItemStatus, UpdateFoodCourtItemByManager, AddItemToManagerFoodCourt, UpdateItemInManagerFoodCourt, RemoveItemFromManagerFoodCourt, UpdateManagerProfile)
  - `server/internal/controllers/admin_controller.go` (CreateFoodCourt, UpdateFoodCourt, UpdateAdminProfile)
  - `server/internal/controllers/user_controller.go` (UpdateUserProfile)
  - `server/internal/models/manager.go` (ContactNo validation tag updated to `min=10,max=15`)
* **Root Cause:**
  Controllers previously bound JSON with `c.BindJSON()` or `c.ShouldBindJSON()` but never called `utils.Validate.Struct(&input)`. Validation tags like `required,gt=0`, `oneof=...`, and phone number rules were bypassed.
* **Resolution:**
  - Added `utils.Validate.Struct(&request)` immediately following JSON binding across all mutating controller handlers.
  - Adjusted phone number validation from rigid `e164` (which broke 10-digit UI submissions) to `omitempty,min=10,max=15` across manager profiles and forms.
  - Added `gt=0` validation to optional price overrides (`Price *float64`).
  - In `CreateFoodCourt`, ensured `AdminID` is populated from request context before struct validation.
* **Verification Results:**
  - Backend compiles cleanly (`go vet ./...` and `go build ./...` pass with exit 0).
  - All existing unit tests pass (`go test ./...` exit 0).
  - Frontend build completes cleanly (`npm run build` exit 0).

---

### [x] VERIFIED: DB-04: Add Unique & Performance Indexes in MongoDB
* **Severity:** High
* **Files Involved:**
  - `server/config/db.go` (Implemented `EnsureIndexes(db *mongo.Database) error`)
  - `server/cmd/main.go` (Invoked `config.EnsureIndexes(db)` at startup)
* **Root Cause:**
  No database indexes were created programmatically, leaving MongoDB to perform collection scans for queries on `user_id`, `vendor_id`, and `foodcourt_id`, and lacking a DB-level unique constraint on `users.email` and `vendors.user_id`.
* **Resolution:**
  - Created `EnsureIndexes(db)` in `server/config/db.go` with a 15-second timeout context:
    - Unique index on `users.email`.
    - Unique index on `vendors.user_id`.
    - Compound unique index on `itemfoodcourts (foodcourt_id, item_id)` and single index on `itemfoodcourts.item_id`.
    - Compound index on `managers (user_id, foodcourt_id)` and single index on `managers.vendor_id`.
    - Index on `items.vendor_id`.
  - Added startup invocation in `server/cmd/main.go` with non-blocking warning logging if dirty development data exists.
* **Verification Results:**
  - Backend compiles cleanly (`go vet ./...` exit 0).
  - Startup routine verified; index definitions match application BSON keys.

---

### [x] VERIFIED: DB-05: Adopt Request Context Propagation (`c.Request.Context()`)
* **Severity:** Medium
* **Files Involved:**
  - `server/internal/controllers/admin_controller.go`
  - `server/internal/controllers/auth_controller.go`
  - `server/internal/controllers/manager_controller.go`
  - `server/internal/controllers/user_controller.go`
  - `server/internal/controllers/vendor_controller.go`
  - `server/internal/controllers/health_controller.go`
  - `server/internal/middlewares/middleware.go`
* **Root Cause:**
  Controllers systematically used detached `context.TODO()` or `context.Background()`. When clients disconnected or requests timed out, MongoDB queries continued executing unchecked on the server.
* **Resolution:**
  - Replaced all detached contexts across all controller endpoints and middlewares with `c.Request.Context()` or `context.WithTimeout(c.Request.Context(), duration)`.
  - Removed unused standard library `"context"` imports in `middleware.go` and `auth_controller.go`.
* **Verification Results:**
  - `grep -rn -E "context\.TODO|context\.Background" server/internal/controllers/ server/internal/middlewares/` returned 0 occurrences.
  - Backend compiles cleanly (`go vet ./...` and `go build ./...` pass with exit 0).

---

## Phase 4: Frontend State, Auth & UX Stability

### [ ] FE-01: Clarify & Stabilize App Startup & Protected Route Auth Flow
* **Severity:** Medium
* **Files Involved:**
  - `client/src/App.tsx` (Lines 14–32)
  - `client/src/store/authStore.ts` (Lines 38–42)
  - `client/src/components/auth/ProtectedRoute.tsx` (Lines 10–14)
* **Root Cause Analysis (Verification of User Question):**
  - **Does normal page reload log out the user?** No, because `App.tsx` renders a full-screen loading spinner while calling `POST /auth/refresh`. When that succeeds, it populates `user` in Zustand before `<AppRoutes />` mounts.
  - **Where is the fragility?**
    1. If a first-time guest visits the site, `initAuth()` runs, calls `/auth/refresh`, logs an unnecessary `401 Unauthorized` in the browser console, and delays showing the landing page.
    2. If the user reloads when the network has a momentary 1-second blip or when the server restarts, `catch` runs `logout()`, permanently clearing their session.
    3. `authStore.ts` partializes `isAuthenticated` to `localStorage` without `user`. Storing `isAuthenticated: true` in `localStorage` is redundant because `App.tsx` ignores it and always blocks until `/auth/refresh` responds.
* **Proposed Fix:**
  1. Only call `initAuth()` if `isAuthenticated` is true, or keep a non-blocking background refresh for public routes.
  2. Add retry logic before calling `logout()` on network errors (e.g. only logout on explicit 401/403, not on network connection errors).
* **Verification Steps:**
  1. Open site as a non-logged-in guest in incognito; verify clean console without 401 errors.
  2. Reload page on `/admin/dashboard`; verify dashboard loads without redirecting to login.

---

### [ ] FE-02: Prevent Race Condition in Axios 401 Token Refresh Interceptor
* **Severity:** High
* **Files Involved:**
  - `client/src/utils/axiosInstance.ts` (Lines 17–44)
* **Root Cause:**
  When multiple parallel requests receive 401, all requests simultaneously invoke `POST /auth/refresh`. Without a mutex/promise lock, multiple refreshes race against each other.
* **Proposed Fix:**
  Implement a shared refresh promise queue:
  ```typescript
  let isRefreshing = false;
  let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

  const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
      if (error) prom.reject(error);
      else prom.resolve(token!);
    });
    failedQueue = [];
  };
  ```
* **Verification Steps:**
  1. Trigger 5 simultaneous API calls with an expired access token.
  2. Verify only one single `POST /auth/refresh` call appears in the Network tab.
  3. Verify all 5 original API calls resolve successfully with the new access token.

---

### [ ] FE-03: Resolve Build-Breaking ESLint Errors
* **Severity:** Medium
* **Files Involved:**
  - `client/src/components/admin/SideBar.tsx` (Line 102)
  - `client/src/components/general/Button.tsx` (Line 34)
  - `client/src/components/general/input/PasswordInput.tsx` (Line 36)
* **Root Cause:**
  - `SideBar.tsx:102`: `item.children!?.map(...)` combines non-null assertion with optional chaining (`@typescript-eslint/no-extra-non-null-assertion`).
  - `Button.tsx:34`: Unused variable `asChild`.
  - `PasswordInput.tsx:36`: Unused variable `showStrength`.
* **Proposed Fix:**
  - Fix `SideBar.tsx`: `item.children?.map(...)` (remove `!`).
  - Remove unused props or implement their intended behavior in `Button.tsx` and `PasswordInput.tsx`.
* **Verification Steps:**
  Run `npm run lint` in `client/` and verify it exits with code 0 (zero errors).

---

### [ ] FE-04: Fix `ConfirmModal` Hardcoded Text & Invisible Backdrop
* **Severity:** Low
* **Files Involved:**
  - `client/src/components/general/ConfirmModel.tsx` (Lines 29–32, Line 72)
* **Root Cause:**
  1. Loading text is hardcoded to `"Logging out..."` inside a generic modal component.
  2. Backdrop has `bg-opacity-50` without a base color (`bg-black`), making the modal backdrop completely transparent.
* **Proposed Fix:**
  1. Add a `loadingText` prop defaulting to `"Processing..."`.
  2. Change backdrop class to `bg-black/50` or `bg-black bg-opacity-50`.
* **Verification Steps:**
  1. Open a confirm modal (e.g., delete item).
  2. Verify backdrop is semi-transparent dark grey/black.
  3. Trigger loading state; verify it shows "Processing..." rather than "Logging out...".

---

### [ ] FE-05: Route-Level Code Splitting (React.lazy)
* **Severity:** Medium
* **Files Involved:**
  - `client/src/routes/routes.tsx`
  - `client/src/routes/*.tsx`
* **Root Cause:**
  Static imports bundle all role views into one 687 KB chunk.
* **Proposed Fix:**
  Lazy-load page components with `React.lazy()` and `<Suspense>`.
* **Verification Steps:**
  Run `npm run build` in `client/` and confirm individual route chunks under 150 KB are generated instead of a single giant chunk.

---

## Phase 5: Code Quality & Clean Architecture

### [ ] ARCH-01: Modularize Massive Controller Files
* **Severity:** Medium
* **Files Involved:**
  - `server/internal/controllers/vendor_controller.go` (2,283 lines)
  - `server/internal/controllers/manager_controller.go` (1,692 lines)
  - `server/internal/controllers/admin_controller.go` (1,270 lines)
* **Root Cause:**
  Extreme file lengths combining route parsing, authorization, database aggregations, and response formatting in single monolithic functions.
* **Proposed Fix:**
  Split by resource domains:
  - `vendor_items.go`, `vendor_managers.go`, `vendor_foodcourts.go`
  - `manager_items.go`, `manager_dashboard.go`
* **Verification Steps:**
  Verify compilation and tests pass after file separation.

---

### [ ] ARCH-02: Eliminate Repeated Collection Definitions
* **Severity:** Low
* **Files Involved:**
  - Controllers in `server/internal/controllers/`
* **Root Cause:**
  An identical 15-line anonymous collections struct is copy-pasted over 40 times across handler functions.
* **Proposed Fix:**
  Create a shared repository or database context struct holding collection references.
* **Verification Steps:**
  Confirm handlers reference the shared struct without duplicate initialization blocks.

---

## Phase 6: DevOps, Testing & Tooling

### [ ] OPS-01: Automated CI Pipeline
* **Severity:** Medium
* **Files Involved:**
  - `.github/workflows/ci.yml` (New File)
* **Proposed Fix:**
  Add a GitHub Actions workflow running:
  - Backend: `go vet ./...`, `golangci-lint run`, `go test ./...`
  - Frontend: `npm run lint`, `npm run build`
* **Verification Steps:**
  Push a commit and confirm the GitHub Actions workflow runs and passes.

### [ ] OPS-02: Containerization (Docker & Compose)
* **Severity:** Low
* **Files Involved:**
  - `Dockerfile.server`
  - `Dockerfile.client`
  - `docker-compose.yml`
* **Proposed Fix:**
  Provide multi-stage Docker builds and a Compose file connecting the Go backend, React frontend, and a local MongoDB instance.
* **Verification Steps:**
  Execute `docker compose up --build` and verify both frontend and backend start and communicate successfully.

### [ ] DOC-01: Correct README Documentation Discrepancies
* **Severity:** Low
* **Files Involved:**
  - `README.md`
* **Proposed Fix:**
  Update README to accurately state:
  - Database: Native Go MongoDB Driver (`go.mongodb.org/mongo-driver`) instead of GORM.
  - State Management: Zustand instead of Redux Toolkit.
  - Auth: Authorization Bearer header + HttpOnly refresh cookie.
* **Verification Steps:**
  Review README for technical accuracy.

