// Example usage component
import Button from '../components/general/Button';

const ButtonExamples = () => {
  return (
    <div className="p-6 space-y-4 bg-gray-50 min-h-screen">
      {/* Different Themes */}
      <div className="space-x-2">
        <Button theme="black" variant="solid">Black Solid</Button>
        <Button theme="white" variant="solid" className="shadow-sm">White Solid</Button>
        <Button theme="slate" variant="solid">Slate Solid</Button>
      </div>

      {/* Different Variants */}
      <div className="space-x-2">
        <Button theme="slate" variant="solid">Solid</Button>
        <Button theme="slate" variant="outline">Outline</Button>
        <Button theme="slate" variant="ghost">Ghost</Button>
        <Button theme="slate" variant="link">Link</Button>
      </div>

      {/* Different Sizes */}
      <div className="space-x-2">
        <Button size="sm" theme="slate">Small</Button>
        <Button size="md" theme="slate">Medium</Button>
        <Button size="lg" theme="slate">Large</Button>
        <Button size="xl" theme="slate">X-Large</Button>
      </div>

      {/* With Icons */}
     
      {/* States */}
      <div className="space-x-2">
        <Button loading theme="slate">
          Loading
        </Button>
        <Button disabled theme="slate">
          Disabled
        </Button>
        <Button loading disabled theme="slate">
          Loading & Disabled
        </Button>
      </div>

      {/* Full Width */}
      <div className="max-w-md">
        <Button fullWidth theme="slate">
          Full Width Button
        </Button>
      </div>

      {/* Custom Styling */}
      <div className="space-x-2">
        <Button 
          theme="slate" 
          className="rounded-full px-8"
        >
          Custom Rounded
        </Button>
        <Button 
          theme="black" 
          className="shadow-lg hover:shadow-xl transition-shadow"
        >
          With Shadow
        </Button>
      </div>

      {/* All HTML Button Props Supported */}
      <div className="space-x-2">
        <Button 
          theme="slate" 
          onClick={() => console.log('Clicked!')}
          onMouseEnter={() => console.log('Hovered!')}
          type="submit"
          aria-label="Submit form"
        >
          With All Props
        </Button>
      </div>
    </div>
  );
};

export default ButtonExamples;