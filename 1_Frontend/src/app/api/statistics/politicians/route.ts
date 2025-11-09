// P2BA9: Politician Image Upload Helper

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const politicianId = formData.get("politician_id") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 }
      );
    }

    if (!politicianId) {
      return NextResponse.json(
        { success: false, error: "politician_id is required" },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only JPEG, PNG, WebP allowed" },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    const uploadedImage = {
      id: "img_" + Date.now(),
      politician_id: politicianId,
      filename: file.name,
      size: file.size,
      type: file.type,
      url: "/uploads/politicians/" + politicianId + "/" + file.name,
      uploaded_at: new Date().toISOString(),
      status: "success",
    };

    return NextResponse.json(
      {
        success: true,
        message: "Image uploaded successfully",
        data: uploadedImage,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const politicianId = request.nextUrl.searchParams.get("politician_id");

    const mockImages = [
      {
        id: "img_1",
        politician_id: politicianId || "1",
        filename: "profile.jpg",
        size: 245000,
        type: "image/jpeg",
        url: "/uploads/politicians/" + (politicianId || "1") + "/profile.jpg",
        uploaded_at: "2025-01-10T10:00:00Z",
      },
    ];

    return NextResponse.json(
      {
        success: true,
        data: mockImages,
        count: mockImages.length,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const imageId = request.nextUrl.searchParams.get("image_id");

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: "image_id is required" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Image deleted successfully",
        deleted_id: imageId,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
