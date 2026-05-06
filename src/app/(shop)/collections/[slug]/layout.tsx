import { Metadata } from "next";
import mongoose from "mongoose";
import { SITE_NAME } from "@/lib/constants";
import { connectDB } from "@/lib/db/mongodb";
import { Collection } from "@/lib/db/models";

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    await connectDB();
    type CollectionDoc = {
      _id: mongoose.Types.ObjectId;
      name: string;
      slug: string;
      description?: string;
    };
    const coll = (await Collection.findOne({ slug }, { name: 1, slug: 1, description: 1 }).lean()) as
      | CollectionDoc
      | null;
    if (!coll) return { title: "Collection | " + SITE_NAME };

    const name = coll.name ?? slug;
    const description =
      coll.description ?? `Shop the ${name} collection at ${SITE_NAME}.`;
    return {
      title: `${name} Collection | ${SITE_NAME}`,
      description,
      openGraph: {
        title: `${name} Collection`,
        description: coll.description ?? description,
      },
    };
  } catch {
    return { title: "Collection | " + SITE_NAME };
  }
}

export default function CollectionSlugLayout({ children }: Props) {
  return <>{children}</>;
}
