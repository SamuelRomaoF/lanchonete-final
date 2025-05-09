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
        <div className="bg-white rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg card-transition">
          <img 
            src={imageUrl} 
            alt={name} 
            className="w-full h-36 object-cover"
          />
          <div className="p-4 text-center">
            <h3 className="font-medium group-hover:text-primary transition-colors">
              {name}
            </h3>
          </div>
        </div>
      </a>
    </Link>
  );
};

export default CategoryCard;
