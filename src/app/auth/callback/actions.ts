"use server";

import prisma from "@/db/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// Renamed for clarity
export async function checkAuthStatus(): Promise<{ success: boolean; error?: string }> {
    console.log("Kinde call back action executed");
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    console.log("Received user data from Kinde:", user)

    if (!user) {
        console.error("checkAuthStatus: No Kinde user session found.");
        return { success: false, error: "Not authenticated" };
    }

    try {
        // Check if user exists in your DB
        const existingUser = await prisma.user.findUnique({ where: { kindeId: user.id } });

        if (!existingUser) {
            // User doesn't exist, create them
            console.log("checkAuthStatus: Creating new user in DB for Kinde ID:", user.id);
            await prisma.user.create({
                data: {
                    kindeId: user.id,
                    email: user.email!,
                    name: (user.given_name ?? "") + " " + (user.family_name ?? ""),
                    image: user.picture,
                },
            });
            console.log("checkAuthStatus: User created successfully.");
        } else {
            // User already exists
            console.log("checkAuthStatus: Existing user found in DB:", user.id);
            // Optional: Add update logic here if needed
        }

        // If we reached here, sync was successful (found or created)
        return { success: true };

    } catch (error) {
        console.error("checkAuthStatus: Error during DB sync:", error);
        return { success: false, error: "Database operation failed" };
    }
}