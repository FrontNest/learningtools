import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";

const categorySelect = {
  id: true,
  parentId: true,
  code: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function assertParent(parentId: string | null | undefined, categoryId?: string) {
  if (!parentId) return;
  if (parentId === categoryId) {
    throw AppError.badRequest("A category cannot be its own parent");
  }
  const parent = await prisma.category.findUnique({ where: { id: parentId } });
  if (!parent) throw AppError.badRequest("Parent category not found");
}

export async function listAllCategories() {
  return prisma.category.findMany({
    select: categorySelect,
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });
}

export async function createCategory(input: { code: string; name: string; parentId?: string | null }) {
  await assertParent(input.parentId);
  try {
    return await prisma.category.create({
      data: { code: input.code, name: input.name, parentId: input.parentId ?? null },
      select: categorySelect,
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      throw AppError.conflict("A category with this code already exists");
    }
    throw error;
  }
}

export async function updateCategory(categoryId: string, input: {
  code?: string;
  name?: string;
  parentId?: string | null;
  active?: boolean;
}) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw AppError.notFound("Category not found");
  await assertParent(input.parentId, categoryId);

  try {
    return await prisma.category.update({
      where: { id: categoryId },
      data: input,
      select: categorySelect,
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      throw AppError.conflict("A category with this code already exists");
    }
    throw error;
  }
}
