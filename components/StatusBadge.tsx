interface StatusBadgeProps {
  status: Status;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusStyles = (status: Status) => {
    switch (status) {
      case "scheduled":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      case "completed":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      className={`px-2 py-1 rounded-full text-center text-white text-14-medium ${getStatusStyles(status)}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
};