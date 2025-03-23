import Image from 'next/image';
import Link from 'next/link';
import { products } from './data/products';
import ProductCollection from './components/product-collection';
import { Button } from '@/components/ui/button';

export default function JohnnyWasHome() {
    const productList = Object.values(products);

    return (
        <div className="space-y-12">
            <section className="relative h-[80vh]">
                {/* Hero Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src="https://aem.johnnywas.com/is/image/oxf/A_FullWidthandTextComponent_1-34?$FullWidthandTextComponent_2880x1480_D$&qlt-70"
                        alt="Johnny Was Hero"
                        fill
                        priority
                        className="object-cover"
                    />
                    {/* Optional overlay for better text readability */}
                    <div className="absolute inset-0 bg-black/20" />
                </div>

                {/* Hero Content */}
                <div className="relative h-full flex items-center justify-center">
                    <div className="text-center max-w-3xl mx-auto px-4">
                        <h1 className="text-5xl font-light mb-6 text-white">Bohemian Luxury</h1>
                        <p className="text-xl text-white/90">
                            Artisanal designs that celebrate beauty, craft, and creativity
                        </p>
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-4 pb-16">
                <h2 className="text-3xl font-light mb-8 text-center text-[#211E1E]">Our Collection</h2>
                <ProductCollection />
            </section>

            <section className="container mx-auto px-4 pb-16">
                <h2 className="text-3xl font-light mb-8 text-center text-[#211E1E]">Featured Collections</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="rounded-lg shadow-md overflow-hidden">
                        <div className="relative h-64">
                            <Image
                                src={productList[0].images[0].url}
                                alt="Spring Collection"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <h3 className="text-2xl font-semibold text-white">Spring Collection</h3>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg shadow-md overflow-hidden">
                        <div className="relative h-64">
                            <Image
                                src={productList[1].images[0].url}
                                alt="Summer Essentials"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <h3 className="text-2xl font-semibold text-white">Summer Essentials</h3>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg shadow-md overflow-hidden">
                        <div className="relative h-64">
                            <Image
                                src={productList[2].images[0].url}
                                alt="Accessories"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <h3 className="text-2xl font-semibold text-white">New Arrivals</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
