import technicianImage from "@/assets/technician.png";

export default function TechnicianIconPNG({
  className = "",
}: {
  className?: string;
}) {
  return (
    <img
      src={technicianImage}
      alt="Technician icon"
      className={`object-contain w-full h-full ${className}`}
      draggable={false}
    />
  );
}
