'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function BackgroundRemoval() {
    const [image, setImage] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [processedImage, setProcessedImage] = useState<string | null>(null)
    const [imageList, setImageList] = useState<string[]>([])
    const [activeTab, setActiveTab] = useState<'photo' | 'color'>('photo')
    const [isRemoving, setIsRemoving] = useState(false)

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = async (e) => {
                const newImage = e.target?.result as string
                setImage(newImage)
                setImageList(prev => [...prev, newImage])

                // Automatically start background removal
                try {
                    setIsRemoving(true)
                    const base64Image = newImage.split(',')[1] // Remove the data:image/jpeg;base64, part

                    const response = await fetch('/api/remove-background', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            image: base64Image,
                        }),
                    })

                    if (!response.ok) {
                        throw new Error('Failed to process image')
                    }

                    const data = await response.json()
                    if (data.error) {
                        throw new Error(data.error)
                    }

                    setImage(data.processedImage)
                    setImageList(prev => prev.map(img =>
                        img === newImage ? data.processedImage : img
                    ))
                } catch (error) {
                    console.error('Error removing background:', error)
                    // Add user notification here if you want
                } finally {
                    setIsRemoving(false)
                }
            }
            reader.readAsDataURL(file)
        }
    }

    const handleAddMoreImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const newImage = e.target?.result as string
                setImageList(prev => [...prev, newImage])
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!image) return

        try {
            setLoading(true)
            const response = await fetch('/api/remove-background', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to process image')
            }

            const data = await response.json()
            setProcessedImage(data.processedImage)
        } catch (error) {
            console.error('Error processing image:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleImageSelect = (selectedImage: string) => {
        setImage(selectedImage)
    }

    const handleNavigateBack = () => {
        const currentIndex = imageList.indexOf(image!)
        if (currentIndex > 0) {
            setImage(imageList[currentIndex - 1])
        }
    }

    const handleNavigateForward = () => {
        const currentIndex = imageList.indexOf(image!)
        if (currentIndex < imageList.length - 1) {
            setImage(imageList[currentIndex + 1])
        }
    }

    const handleDeleteImage = () => {
        const currentIndex = imageList.indexOf(image!)
        setImageList(prev => {
            const newList = prev.filter((_, i) => i !== currentIndex)
            // If there are remaining images, select the next one or the previous one
            if (newList.length > 0) {
                if (currentIndex < newList.length) {
                    setImage(newList[currentIndex])
                } else {
                    setImage(newList[newList.length - 1])
                }
            } else {
                setImage(null) // No images left, return to upload screen
            }
            return newList
        })
    }

    return (
        <div className="h-screen overflow-hidden bg-white flex flex-col">
            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {!image ? (
                    // Initial upload screen
                    <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                        <div className="max-w-xl w-full">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900">
                                    Upload an Image
                                </h2>
                                <p className="mt-2 text-gray-600">
                                    Upload your image to start editing
                                </p>
                            </div>

                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="imageUpload"
                                />
                                <label
                                    htmlFor="imageUpload"
                                    className="cursor-pointer flex flex-col items-center"
                                >
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-700 font-medium">Drop your image here</p>
                                    <p className="text-gray-500 text-sm mt-1">or click to browse</p>
                                </label>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Editor view
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left side - Image Preview */}
                        <div className="flex-1 relative">
                            <div className="absolute inset-0 flex items-center justify-center p-8">
                                <div className="relative w-full max-w-[500px] rounded-2xl overflow-hidden">
                                    <div className="aspect-[3/4] relative">
                                        <Image
                                            src={image}
                                            alt="Uploaded image"
                                            fill
                                            className="object-contain"
                                            sizes="(max-width: 768px) 100vw, 500px"
                                            priority
                                            style={{
                                                objectFit: 'contain',
                                                backgroundColor: 'transparent'
                                            }}
                                        />
                                        {isRemoving && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <p className="text-white font-medium">Removing Background...</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Controls */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
                                <button
                                    onClick={handleDeleteImage}
                                    className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleNavigateBack}
                                    disabled={imageList.indexOf(image!) <= 0}
                                    className={`p-2 bg-white/90 backdrop-blur-sm rounded-full transition-colors shadow-lg ${imageList.indexOf(image!) <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleNavigateForward}
                                    disabled={imageList.indexOf(image!) >= imageList.length - 1}
                                    className={`p-2 bg-white/90 backdrop-blur-sm rounded-full transition-colors shadow-lg ${imageList.indexOf(image!) >= imageList.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19l7-7-7-7" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Right side - Tools Panel */}
                        <div className="w-[320px] bg-white border-l flex flex-col">
                            <div className="flex-1 overflow-y-auto">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-semibold">Edit Image</h2>
                                        <button
                                            onClick={() => setImage(null)}
                                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Tab buttons */}
                                    <div className="flex gap-4 mb-6">
                                        <button
                                            onClick={() => setActiveTab('photo')}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'photo'
                                                ? 'bg-gray-100 text-gray-900'
                                                : 'text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            Photo
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('color')}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'color'
                                                ? 'bg-gray-100 text-gray-900'
                                                : 'text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            Color
                                        </button>
                                    </div>

                                    {/* Conditional content based on active tab */}
                                    {activeTab === 'photo' ? (
                                        // Photo tab content
                                        <div className="mb-8">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-medium">Search</h3>
                                                <span className="text-[10px] bg-amber-400 px-1.5 py-0.5 rounded-full font-medium">New</span>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-4">
                                                Search 30+ million backgrounds powered by Pexels
                                            </p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {/* Empty upload box */}
                                                <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </div>
                                                {/* Sample images - replace src with your actual images */}
                                                <div className="aspect-square relative rounded-lg overflow-hidden">
                                                    <Image src="/sample1.jpg" alt="Sample 1" fill className="object-cover" />
                                                </div>
                                                <div className="aspect-square relative rounded-lg overflow-hidden">
                                                    <Image src="/sample2.jpg" alt="Sample 2" fill className="object-cover" />
                                                </div>
                                                <div className="aspect-square relative rounded-lg overflow-hidden">
                                                    <Image src="/sample3.jpg" alt="Sample 3" fill className="object-cover" />
                                                </div>
                                                <div className="aspect-square relative rounded-lg overflow-hidden">
                                                    <Image src="/sample4.jpg" alt="Sample 4" fill className="object-cover" />
                                                </div>
                                                <div className="aspect-square relative rounded-lg overflow-hidden">
                                                    <Image src="/sample5.jpg" alt="Sample 5" fill className="object-cover" />
                                                </div>
                                                <div className="aspect-square relative rounded-lg overflow-hidden">
                                                    <Image src="/sample6.jpg" alt="Sample 6" fill className="object-cover" />
                                                </div>
                                                <div className="aspect-square relative rounded-lg overflow-hidden">
                                                    <Image src="/sample7.jpg" alt="Sample 7" fill className="object-cover" />
                                                </div>
                                                <div className="aspect-square relative rounded-lg overflow-hidden">
                                                    <Image src="/sample8.jpg" alt="Sample 8" fill className="object-cover" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // Color tab content
                                        <div className="mb-8">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-medium">Select Color</h3>
                                            </div>
                                            <div className="grid grid-cols-6 gap-2">
                                                {[
                                                    '#FF0000', '#00FF00', '#0000FF',
                                                    '#FFFF00', '#FF00FF', '#00FFFF',
                                                    '#FFA500', '#800080', '#008000',
                                                    '#FFC0CB', '#808080', '#000000'
                                                ].map((color, index) => (
                                                    <button
                                                        key={index}
                                                        className="aspect-square rounded-lg p-1"
                                                        style={{ backgroundColor: color }}
                                                        onClick={() => {
                                                            // Handle color selection
                                                            console.log('Selected color:', color)
                                                        }}
                                                    >
                                                        <div className="w-full h-full rounded-md" />
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Custom Color
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        className="h-10 w-20 rounded cursor-pointer"
                                                        onChange={(e) => {
                                                            // Handle custom color selection
                                                            console.log('Custom color:', e.target.value)
                                                        }}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="#FFFFFF"
                                                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                                        onChange={(e) => {
                                                            // Handle hex code input
                                                            console.log('Hex code:', e.target.value)
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Image List Section */}
                                    <div className="border-t pt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-medium">Your Images</h3>
                                            <label
                                                htmlFor="addMoreImages"
                                                className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAddMoreImages}
                                                className="hidden"
                                                id="addMoreImages"
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {imageList.map((img, index) => (
                                                <div
                                                    key={index}
                                                    className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden ${img === image ? 'ring-2 ring-blue-500' : ''
                                                        }`}
                                                    onClick={() => handleImageSelect(img)}
                                                >
                                                    <Image
                                                        src={img}
                                                        alt={`Image ${index + 1}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setImageList(prev => {
                                                                const newList = prev.filter((_, i) => i !== index)
                                                                if (img === image && newList.length > 0) {
                                                                    setImage(newList[0])
                                                                }
                                                                return newList
                                                            })
                                                        }}
                                                        className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Processed Image Modal */}
            {processedImage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-8">
                    <div className="bg-white rounded-lg max-w-4xl w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Processed Image</h2>
                            <button
                                onClick={() => setProcessedImage(null)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="relative w-full rounded-lg overflow-hidden bg-[url('/grid-bg.png')] bg-repeat">
                            <div className="aspect-[4/3] relative">
                                <Image
                                    src={processedImage}
                                    alt="Processed image"
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 768px) 100vw, 800px"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={() => window.open(processedImage, '_blank')}
                                className="flex-1 bg-black text-white py-2 px-4 rounded-lg font-medium hover:bg-black/90 transition-colors"
                            >
                                Download Image
                            </button>
                            <button
                                onClick={() => setProcessedImage(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
