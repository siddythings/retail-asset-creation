import { NextResponse } from "next/server";
import { getBackendUrl, safeFetch } from "@/services/api-utils";

// Add this export to prevent static generation
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Create a JSON payload that matches the TryOnRequest schema expected by FastAPI
    const clothingType = (formData.get("clothingType") as string) || "tops";
    const clothingImageUrl = (formData.get("clothingImageUrl") as string) || "";
    const modelImageUrl = (formData.get("modelImageUrl") as string) || "";
    const gender = (formData.get("gender") as string) || "female";
    const apiProvider = (formData.get("apiProvider") as string) || "aidge";

    // Get backend URL using the utility function
    const backendUrl = getBackendUrl();

    // Handle file uploads if present
    let clothingFileUrl = "";
    let modelFileUrl = "";

    // Get base64 images if present
    const modelImageBase64 = formData.get("modelImageBase64") as string;
    const garmentImageBase64 = formData.get("garmentImageBase64") as string;

    const clothingFile = formData.get("clothingImage") as File;
    const modelFile = formData.get("modelImage") as File;

    // If files are present, upload them first
    if (clothingFile) {
      // Check if we should use base64 for Fashn.ai
      if (apiProvider === "fashn") {
        // Convert file to base64
        const arrayBuffer = await clothingFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString("base64");

        // Upload as base64
        const clothingBase64Response = await safeFetch(
          `${backendUrl}/api/virtual-try-on/upload-base64`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              base64_image: `data:${clothingFile.type};base64,${base64Data}`,
              image_type: "clothing",
              filename: `${Date.now()}-${clothingFile.name}`,
            }),
          }
        );

        if (!clothingBase64Response.ok) {
          const errorData = await clothingBase64Response.json();
          throw new Error(
            errorData.error || "Failed to upload clothing image as base64"
          );
        }

        const clothingUploadResult = await clothingBase64Response.json();
        clothingFileUrl = clothingUploadResult.fileUrl;
      } else {
        // Use the regular file upload for other providers
        const clothingFormData = new FormData();
        clothingFormData.append("file", clothingFile);

        const clothingUploadResponse = await safeFetch(
          `${backendUrl}/api/virtual-try-on/upload-clothing`,
          {
            method: "POST",
            body: clothingFormData,
          }
        );

        if (!clothingUploadResponse.ok) {
          const errorData = await clothingUploadResponse.json();
          throw new Error(errorData.error || "Failed to upload clothing image");
        }

        const clothingUploadResult = await clothingUploadResponse.json();
        clothingFileUrl = clothingUploadResult.fileUrl;
      }
    } else if (garmentImageBase64 && apiProvider === "fashn") {
      // Upload base64 image directly
      const clothingBase64Response = await safeFetch(
        `${backendUrl}/api/virtual-try-on/upload-base64`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base64_image: garmentImageBase64,
            image_type: "clothing",
            filename: `${Date.now()}-garment.jpg`,
          }),
        }
      );

      if (!clothingBase64Response.ok) {
        const errorData = await clothingBase64Response.json();
        throw new Error(
          errorData.error || "Failed to upload clothing image as base64"
        );
      }

      const clothingUploadResult = await clothingBase64Response.json();
      clothingFileUrl = clothingUploadResult.fileUrl;
    }

    if (modelFile) {
      // Check if we should use base64 for Fashn.ai
      if (apiProvider === "fashn") {
        // Convert file to base64
        const arrayBuffer = await modelFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString("base64");

        // Upload as base64
        const modelBase64Response = await safeFetch(
          `${backendUrl}/api/virtual-try-on/upload-base64`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              base64_image: `data:${modelFile.type};base64,${base64Data}`,
              image_type: "model",
              filename: `${Date.now()}-${modelFile.name}`,
            }),
          }
        );

        if (!modelBase64Response.ok) {
          const errorData = await modelBase64Response.json();
          throw new Error(
            errorData.error || "Failed to upload model image as base64"
          );
        }

        const modelUploadResult = await modelBase64Response.json();
        modelFileUrl = modelUploadResult.fileUrl;
      } else {
        // Use the regular file upload for other providers
        const modelFormData = new FormData();
        modelFormData.append("file", modelFile);

        const modelUploadResponse = await safeFetch(
          `${backendUrl}/api/virtual-try-on/upload-model`,
          {
            method: "POST",
            body: modelFormData,
          }
        );

        if (!modelUploadResponse.ok) {
          const errorData = await modelUploadResponse.json();
          throw new Error(errorData.error || "Failed to upload model image");
        }

        const modelUploadResult = await modelUploadResponse.json();
        modelFileUrl = modelUploadResult.fileUrl;
      }
    } else if (modelImageBase64 && apiProvider === "fashn") {
      // Upload base64 image directly
      const modelBase64Response = await safeFetch(
        `${backendUrl}/api/virtual-try-on/upload-base64`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base64_image: modelImageBase64,
            image_type: "model",
            filename: `${Date.now()}-model.jpg`,
          }),
        }
      );

      if (!modelBase64Response.ok) {
        const errorData = await modelBase64Response.json();
        throw new Error(
          errorData.error || "Failed to upload model image as base64"
        );
      }

      const modelUploadResult = await modelBase64Response.json();
      modelFileUrl = modelUploadResult.fileUrl;
    }

    // Prepare the final payload
    const finalClothingUrl = clothingFileUrl || clothingImageUrl;
    const finalModelUrl = modelFileUrl || modelImageUrl;

    if (!finalClothingUrl) {
      throw new Error("No clothing image provided");
    }

    if (!finalModelUrl) {
      throw new Error("No model image provided");
    }

    // Create the TryOnRequest payload
    const tryOnRequest = {
      clothesList: [
        {
          imageUrl: finalClothingUrl || clothingImageUrl,
          type: clothingType,
        },
      ],
      modelImage: [finalModelUrl || modelImageUrl],
      gender: gender,
      apiProvider: apiProvider,
      // Add other parameters from the form
      style: (formData.get("style") as string) || "universal_1",
      body: (formData.get("body") as string) || "slim",
      viewType: (formData.get("viewType") as string) || "mixed",
      generateCount: parseInt((formData.get("numSamples") as string) || "4"),
      inputQualityDetect: 0,
    };

    // Add Fashn.ai specific parameters if the provider is fashn
    if (apiProvider === "fashn") {
      // For Fashn.ai, modify the request to include base64 images if they exist
      if (garmentImageBase64) {
        tryOnRequest.clothesList[0].imageUrl = garmentImageBase64;
      }

      if (modelImageBase64) {
        tryOnRequest.modelImage[0] = modelImageBase64;
      }

      // Add Fashn.ai specific parameters
      Object.assign(tryOnRequest, {
        mode: (formData.get("mode") as string) || "quality",
        garmentPhotoType:
          (formData.get("garmentPhotoType") as string) || "auto",
        numSamples: parseInt((formData.get("numSamples") as string) || "4"),
        restoreBackground: formData.get("restoreBackground") === "true",
        coverFeet: formData.get("coverFeet") === "true",
        adjustHands: formData.get("adjustHands") === "true",
        restoreClothes: formData.get("restoreClothes") === "true",
        nsfw_filter: formData.get("nsfw_filter") === "true",
        longTop: formData.get("longTop") === "true",
        seed: formData.get("seed")
          ? parseInt(formData.get("seed") as string)
          : Math.floor(Math.random() * 10000000),
      });
    }

    // Call the FastAPI backend with the proper JSON payload
    const response = await safeFetch(
      `${backendUrl}/api/virtual-try-on/execute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tryOnRequest),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error executing try-on process. Server response:", errorData);
      throw new Error(errorData.detail || "Failed to execute try-on process");
    }

    // Return the response from the backend
    const data = await response.json();
    
    // Log the response for debugging
    console.log("Try-on API response:", JSON.stringify(data, null, 2));
    
    // Add additional validation to ensure we have image data
    if (data.images && data.images.length > 0) {
      console.log(`Found ${data.images.length} images in response`);
    } else if (data.output && Array.isArray(data.output)) {
      console.log(`Found ${data.output.length} images in output array`);
      // Convert to proper format if needed
      if (!data.images) {
        data.images = data.output.map((url: string) => ({ outputImageUrl: url }));
      }
    } else if (data.output && typeof data.output === 'object' && data.output.output_urls && Array.isArray(data.output.output_urls)) {
      // Handle Fashn.ai nested format
      console.log(`Found ${data.output.output_urls.length} images in output.output_urls array`);
      if (!data.images) {
        data.images = data.output.output_urls.map((url: string) => ({ outputImageUrl: url }));
      }
    } else {
      console.warn("No images found in API response:", data);
      // Add a default empty images array to avoid errors
      data.images = [];
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error executing try-on process:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to execute try-on process",
      },
      { status: 500 }
    );
  }
}
