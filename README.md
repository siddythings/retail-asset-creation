# Retail Asset Creation Platform

A comprehensive Next.js application for AI-powered retail asset creation and management, providing an intuitive user interface to generate, manipulate, and manage retail product imagery.

## Demo
<video src="./demo/1e692cf3-a2c3-d687-9267-8808294fdaa7_custom.mp4" controls></video>

Watch the demo video above to see the Retail Asset Creation Platform in action, showcasing model generation, virtual try-on, background manipulation, and catalog creation features.

## Features

- **Model Generation** - Create realistic human models with customizable attributes (body size, skin color, age)
- **Virtual Try-On** - Visualize clothing items on model images with AI-powered fitting
- **Background Generation** - Create custom backgrounds for product images
- **Background Removal** - Automatically remove backgrounds from product images
- **Image Tagging** - Automatically tag and analyze retail images using AI
- **Catalog Generation** - Create professional product catalogs with AI-generated assets
- **Gallery Management** - Store, organize, and reuse all generated assets
- **Multi-Model Support** - Integration with multiple AI providers and models for different tasks

## Technologies

### Frontend
- **Next.js** - React framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - UI component library
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Backend
- **FastAPI** - High-performance Python web framework
- **Leonardo.ai** - AI model generation API 
- **Fashn.ai** - Virtual try-on API
- **OpenAI** - Image tagging and analysis
- **Bria API** - Background replacement

## Setup

1. **Install frontend dependencies**:
   ```bash
   npm install
   ```

2. **Install backend dependencies**:
   ```bash
   cd fastapi_backend
   pip install -r requirements.txt
   ```

3. **Configure environment variables**:
   
   Frontend (.env.local):
   ```plaintext
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_LEONARDO_API_KEY=your_leonardo_api_key
   NEXT_PUBLIC_FASHN_API_KEY=your_fashn_api_key
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_BRIA_API_KEY=your_bria_api_key
   ```
   
   Backend (.env in fastapi_backend directory):
   ```plaintext
   LEONARDO_API_KEY=your_leonardo_api_key
   FASHN_API_KEY=your_fashn_api_key
   OPENAI_API_KEY=your_openai_api_key
   BRIA_API_KEY=your_bria_api_key
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   REDIS_URL=redis://localhost:6379
   ```

4. **Database Setup**:
   - Install PostgreSQL if not already installed
   - Create a new database
   - Run migrations:
     ```bash
     cd fastapi_backend
     alembic upgrade head
     ```

5. **Redis Setup**:
   - Install Redis if not already installed
   - Ensure Redis server is running locally or update REDIS_URL accordingly

6. **Start the development servers**:
   
   Frontend:
   ```bash
   npm run dev
   ```
   
   Backend:
   ```bash
   cd fastapi_backend
   python run.py
   ```

7. **Build for production**:
   ```bash
   npm run build
   ```

## System Requirements

- Node.js 18.x or higher
- Python 3.9 or higher
- PostgreSQL 13 or higher
- Redis 6.x or higher
- At least 8GB RAM recommended for AI processing
- GPU recommended for faster processing (optional)

## Application Structure

### Frontend
- **app/page.tsx** - Home page with feature overview
- **app/model-generation/** - AI model generation interface
- **app/try-on/** - Virtual try-on interface
- **app/background-generator/** - Background generation interface
- **app/background-removal/** - Background removal interface
- **app/image-tagging/** - Image tagging and analysis interface
- **app/catalog-generator/** - Catalog generation interface
- **app/gallery/** - Gallery to view all generated assets
- **components/** - Reusable UI components
- **services/** - API services for backend communication

### Backend
- **fastapi_backend/app/api/** - API endpoints and routers
- **fastapi_backend/services/** - Service implementations for different features
- **fastapi_backend/app/schemas/** - Data models and validation schemas

## Features In Detail

### Model Generation
Generate photorealistic human models with customizable attributes using Leonardo.ai's advanced models. Control body size, skin color, age, and other parameters to create perfect models for your product imagery.

### Virtual Try-On
Visualize how clothing items will look on models using AI-powered fitting. Upload model images and garment images to see realistic try-on results.

### Background Generation
Create custom backgrounds for product images based on textual descriptions. Generate professional studio settings, lifestyle environments, or any other background for your products.

### Image Tagging
Automatically analyze and tag retail images using AI. Extract product attributes, descriptions, and other useful information from your product images.

### Catalog Generation
Combine all assets to create professional product catalogs with consistent styling, backgrounds, and presentation.

## API Integration

The application integrates with multiple AI providers:

- **Leonardo.ai** - For realistic model generation
- **Fashn.ai** - For virtual try-on functionality
- **OpenAI** - For image analysis and tagging
- **Bria** - For background replacement

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
