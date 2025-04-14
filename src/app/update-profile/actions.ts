"use server";

import prisma from "@/db/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { User } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getUserProfileAction() {
	const { getUser, isAuthenticated } = getKindeServerSession();
	const isLoggedIn = await isAuthenticated();
	const user = await getUser();

	if (!isLoggedIn) return null;

	const currentUser = await prisma.user.findUnique({ where: { kindeId: user?.id } });
	return currentUser;
}

export async function updateUserProfileAction({ name, image }: { name: string; image: string }) {
	const { getUser, isAuthenticated } = getKindeServerSession();
	const isLoggedIn = await isAuthenticated();
	const user = await getUser();

	if (!isLoggedIn) throw new Error("Unauthorized");

	const updatedFields: Partial<User> = {};

	if (name) updatedFields.name = name;
	if (image) updatedFields.image = image;

	const updatedUser = await prisma.user.update({
		where: { kindeId: user?.id },
		data: updatedFields,
	});

	revalidatePath("/update-profile");

	return { success: true, user: updatedUser };
}
