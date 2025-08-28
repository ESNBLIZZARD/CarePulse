import clsx from "clsx";
import Image from "next/image";
import { MdOutlineDoneAll } from "react-icons/md";


type StatCardProps = {
  type: "appointments" | "pending" | "cancelled" | "completed";
  count: number;
  label: string;
  icon: string;
};

export const StatCard = ({ count = 0, label, icon, type }: StatCardProps) => {
  return (
    <div
      className={clsx(
        "stat-card rounded-lg p-4 shadow-md transition-all duration-300 hover:shadow-lg",
        {
          "bg-appointments": type === "appointments",
          "bg-pending": type === "pending" || type === "completed",
          "bg-cancelled": type === "cancelled",
        }
      )}
    >
      <div className="flex items-center gap-4">
        {type === "completed" ? (
          <MdOutlineDoneAll
            className={clsx(
              "size-8 transition-opacity duration-300",
              "text-green-500"
            )}
          />
        ) : (
          <Image
            src={icon}
            height={32}
            width={32}
            alt={`${label.toLowerCase()} icon`}
            className={clsx("size-8 w-fit transition-opacity duration-300", {
              "opacity-70 hover:opacity-100": true,
            })}
          />
        )}
        <h2
          className={clsx("text-32-bold text-white transition-all duration-300", {
            "text-shadow-md text-green-100 drop-shadow-lg": type === "completed",
            "text-shadow-sm": type !== "completed",
          })}
        >
          {count}
        </h2>
      </div>

      <p
        className={clsx("text-14-regular mt-2", {
          "text-gray-200": type === "completed",
          "text-white": type !== "completed",
        })}
      >
        {label}
      </p>
    </div>
  );
};