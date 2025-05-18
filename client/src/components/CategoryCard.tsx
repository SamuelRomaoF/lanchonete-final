import { Link } from "wouter";

interface CategoryCardProps {
  id: number;
  name: string;
  imageUrl: string;
}

const CategoryCard = ({ id, name, imageUrl }: CategoryCardProps) => {
  return (
    <Link href={`/produtos/${id}`}>
      <a className="group">
        <div className="relative h-36 w-full overflow-hidden rounded-md">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover transition-all duration-300 hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200">
              <span className="text-gray-400">Imagem não disponível</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 w-full p-3">
            <h3 className="text-lg font-medium text-white">{name}</h3>
          </div>
        </div>
      </a>
    </Link>
  );
};

export default CategoryCard;
