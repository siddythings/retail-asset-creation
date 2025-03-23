'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

// This is a placeholder page for the tagged images gallery
// In a real implementation, you would add API calls to fetch saved tagged images

export default function TaggedImages() {
  const [savedImages, setSavedImages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Simulated data for demonstration purposes
  useEffect(() => {
    // Here you would typically fetch from an API/database
    // For now we'll use mock data
    setTimeout(() => {
      setSavedImages([
        {
          id: '1',
          name: 'Blue Dress.jpg',
          timestamp: '2023-03-15 14:22:35',
          analysis: {
            caption: 'A blue floral summer dress with spaghetti straps',
            retail_attributes: {
              product_type: 'Summer Dress',
              colors: ['Blue', 'White'],
              patterns: ['Floral'],
              materials: ['Cotton', 'Polyester'],
              style: ['Casual', 'Summer'],
              age_group: 'Adult',
              occasion: 'Casual, Summer'
            },
            model: 'gpt-4o'
          },
          visualization: '/placeholder-image.jpg' // Replace with actual image path
        },
        {
          id: '2',
          name: 'Red T-shirt.jpg',
          timestamp: '2023-03-14 10:15:22',
          analysis: {
            caption: 'A red cotton t-shirt with round neck',
            retail_attributes: {
              product_type: 'T-shirt',
              colors: ['Red'],
              patterns: [],
              materials: ['Cotton'],
              style: ['Casual', 'Basic'],
              age_group: 'Adult',
              occasion: 'Casual, Everyday'
            },
            model: 'gpt-4o-mini'
          },
          visualization: '/placeholder-image.jpg' // Replace with actual image path
        }
      ])
      setIsLoading(false)
    }, 1000)
  }, [])
  
  return (
    <div className="container py-8">
      <div className="flex items-center mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Tagged Images</h1>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
          <TabsTrigger value="all">All Images</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">All Tagged Images</h2>
            <Link href="/image-tagging">
              <Button>Tag New Images</Button>
            </Link>
          </div>
          
          <Separator />
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : savedImages.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedImages.map((image) => (
                <Card key={image.id} className="overflow-hidden">
                  <div className="aspect-square bg-muted relative">
                    {/* Replace with actual image */}
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      Image Placeholder
                    </div>
                  </div>
                  
                  <CardHeader className="py-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{image.name}</CardTitle>
                      <Badge>{image.analysis.retail_attributes.product_type}</Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {image.timestamp} • {image.analysis.model}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0 pb-3">
                    <p className="text-sm line-clamp-2">{image.analysis.caption}</p>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {image.analysis.retail_attributes.colors.map((color: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{color}</Badge>
                      ))}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-0 flex justify-between">
                    <Button variant="ghost" size="sm">View Details</Button>
                    <Button variant="outline" size="sm">Download</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <p className="text-muted-foreground">No tagged images yet</p>
              <Link href="/image-tagging">
                <Button>Tag Your First Image</Button>
              </Link>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recent">
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Recent images will be shown here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="collections">
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Collections feature coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 