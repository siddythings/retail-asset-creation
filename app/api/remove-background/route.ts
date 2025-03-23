import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { image } = await req.json()

        // Call the remove.bg API
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'Api-Key': process.env.REMOVE_BG_API_KEY!, // You'll need to add this to your .env file
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: image,
                size: 'auto',
                format: 'auto',
                type: 'auto',
            }),
        })

        if (!response.ok) {
            throw new Error('Failed to remove background')
        }

        const buffer = await response.arrayBuffer()
        const base64Image = Buffer.from(buffer).toString('base64')
        const processedImage = `data:image/png;base64,${base64Image}`

        return NextResponse.json({ processedImage })
    } catch (error) {
        console.error('Error in remove-background API:', error)
        return NextResponse.json(
            { error: 'Failed to process image' },
            { status: 500 }
        )
    }
} 