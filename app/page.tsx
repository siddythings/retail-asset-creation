import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import GalleryPreview from "@/components/gallery-preview";

export default function Home() {
  return (
    <main className="flex flex-col">
      <div className="min-h-screen container flex flex-col items-center justify-center space-y-8 py-16 md:py-24 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          Retail Asset Creation
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Transform your product images with our suite of AI-powered tools.
          Virtual try-on, background manipulation, and intelligent image tagging
          - all in one platform.
        </p>
        <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
          <Link href="/model-generation">
            <Button size="lg" className="gap-2">
              Model Generation
            </Button>
          </Link>
          <Link href="/try-on">
            <Button size="lg" className="gap-2">
              Try On
            </Button>
          </Link>
          <Link href="/background-generator">
            <Button size="lg" className="gap-2">
              Background Generator
            </Button>
          </Link>
          <Link href="/image-tagging">
            <Button size="lg" className="gap-2">
              Image Tagging
            </Button>
          </Link>
          <Link href="/edit-image">
            <Button size="lg" className="gap-2">
              Edit Image
            </Button>
          </Link>
          <Link href="/product-generator">
            <Button size="lg" className="gap-2">
              Product Generator
            </Button>
          </Link>
          <Link href="/all-in-one">
            <Button size="lg" className="gap-2 bg-teal-600 hover:bg-teal-700">
              All In One
            </Button>
          </Link>
        </div>
        <Link href="/gallery">
          <Button size="lg" variant="secondary">
            View Gallery
          </Button>
        </Link>
      </div>

      {/* Solutions Section */}
      <section className="w-full py-12 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Our Solutions
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-lg">
              Discover our complete suite of tools designed to enhance your
              retail product imagery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Model Generation */}
            <div className="flex flex-col p-6 bg-background rounded-lg shadow-sm border border-rose-200">
              <h3 className="text-xl font-bold mb-2 text-rose-600">
                Model Generation
              </h3>
              <p className="text-muted-foreground mb-4 flex-grow">
                Generate realistic female models with customizable attributes.
                Choose body size, skin color, age, and more to perfectly
                showcase your products.
              </p>
              <div className="mt-auto">
                <Link href="/model-generation">
                  <Button className="w-full bg-rose-600 hover:bg-rose-700">
                    Try Now
                  </Button>
                </Link>
              </div>
            </div>

            {/* Try On */}
            <div className="flex flex-col p-6 bg-background rounded-lg shadow-sm border border-blue-200">
              <h3 className="text-xl font-bold mb-2 text-blue-600">Try On</h3>
              <p className="text-muted-foreground mb-4 flex-grow">
                See how garments look on models or yourself with our advanced AI
                technology. Simply upload a model photo and garment image to
                visualize the perfect fit.
              </p>
              <div className="mt-auto">
                <Link href="/try-on">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Try Now
                  </Button>
                </Link>
              </div>
            </div>

            {/* Background Generator */}
            <div className="flex flex-col p-6 bg-background rounded-lg shadow-sm border border-green-200">
              <h3 className="text-xl font-bold mb-2 text-green-600">
                Background Generator
              </h3>
              <p className="text-muted-foreground mb-4 flex-grow">
                Create stunning custom backgrounds for your products using AI.
                Set the scene with descriptive prompts and place your products
                in any environment.
              </p>
              <div className="mt-auto">
                <Link href="/background-generator">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Try Now
                  </Button>
                </Link>
              </div>
            </div>

            {/* Image Tagging */}
            <div className="flex flex-col p-6 bg-background rounded-lg shadow-sm border border-amber-200">
              <h3 className="text-xl font-bold mb-2 text-amber-600">
                Image Tagging
              </h3>
              <p className="text-muted-foreground mb-4 flex-grow">
                Automatically analyze retail images to extract product
                attributes. Identify colors, patterns, materials, and more with
                our AI tagging technology.
              </p>
              <div className="mt-auto">
                <Link href="/image-tagging">
                  <Button className="w-full bg-amber-600 hover:bg-amber-700">
                    Try Now
                  </Button>
                </Link>
              </div>
            </div>

            {/* Edit Image */}
            <div className="flex flex-col p-6 bg-background rounded-lg shadow-sm border border-purple-200">
              <h3 className="text-xl font-bold mb-2 text-purple-600">
                Edit Image
              </h3>
              <p className="text-muted-foreground mb-4 flex-grow">
                Powerful AI-based image editing tools including smart eraser
                and generative fill for seamless content removal and
                replacement.
              </p>
              <div className="mt-auto">
                <Link href="/edit-image">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    Try Now
                  </Button>
                </Link>
              </div>
            </div>

            {/* Product Generator */}
            <div className="flex flex-col p-6 bg-background rounded-lg shadow-sm border border-indigo-200">
              <h3 className="text-xl font-bold mb-2 text-indigo-600">
                Product Generator
              </h3>
              <p className="text-muted-foreground mb-4 flex-grow">
                Generate complete product images with AI. Create customized
                product visualizations quickly and efficiently for your catalog.
              </p>
              <div className="mt-auto">
                <Link href="/product-generator">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                    Try Now
                  </Button>
                </Link>
              </div>
            </div>

            {/* All In One */}
            <div className="flex flex-col p-6 bg-background rounded-lg shadow-sm border border-teal-200">
              <h3 className="text-xl font-bold mb-2 text-teal-600">
                All In One
              </h3>
              <p className="text-muted-foreground mb-4 flex-grow">
                Access all our tools in one seamless workflow. Transform your
                product images from start to finish with our complete suite of
                AI-powered solutions.
              </p>
              <div className="mt-auto">
                <Link href="/all-in-one">
                  <Button className="w-full bg-teal-600 hover:bg-teal-700">
                    Try Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="w-full py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                View All Your Results in One Place
              </h2>
              <p className="text-muted-foreground md:text-xl">
                Our Gallery provides a centralized location to view, manage and
                showcase all your processed images.
              </p>
              <ul className="grid gap-3">
                <li className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>All try-on results stored in one place</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Background removal and generator results</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Tagged product images with detailed attributes</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Filter results by service type</span>
                </li>
              </ul>
              <div className="mt-6">
                <Link href="/gallery">
                  <Button size="lg">Explore Gallery</Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-md overflow-hidden rounded-lg border bg-background shadow-xl">
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Gallery view of your processed images
                  </p>
                  <GalleryPreview />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
