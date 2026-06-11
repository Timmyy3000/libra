import { BookDetailClient } from "@/components/book-detail-client";

type BookPageProps = {
  params: Promise<{ bookId: string }>;
};

export default async function BookPage({ params }: BookPageProps) {
  const { bookId } = await params;
  return <BookDetailClient bookId={bookId} />;
}
