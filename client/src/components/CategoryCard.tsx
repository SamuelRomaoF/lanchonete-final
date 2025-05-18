import { Link } from "wouter";

interface CategoryCardProps {
  id: number;
  name: string;
  imageUrl?: string;
}

const CategoryCard = ({ id, name }: CategoryCardProps) => {
  return (
    <Link href={`/produtos/${id}`}>
      <a className="group">
        <div className="bg-white dark:bg-card rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg dark:hover:shadow-gray-900 card-transition h-24 flex items-center justify-center">
          <div className="p-4 text-center">
            <h3 className="font-medium dark:text-card-foreground group-hover:text-primary transition-colors">
              {name}
            </h3>
          </div>
        </div>
      </a>
    </Link>
  );
};

export default CategoryCard;
