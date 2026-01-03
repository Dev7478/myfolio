import { useEffect, useState } from "react";

type UseMouseOptions = {
  allowAngle?: boolean;
  allowAcc?: boolean;
};

export const useMouse = ({
  allowAngle = false,
  allowAcc = false,
}: UseMouseOptions = {}) => {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [angle, setAngle] = useState(0);
  const [acceleration, setAcceleration] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // ✅ viewport-based coordinates
      setX(e.clientX);
      setY(e.clientY);

      if (allowAcc) {
        setAcceleration(Math.abs(e.movementX) + Math.abs(e.movementY));
      }

      if (allowAngle) {
        setAngle(Math.atan2(e.movementY, e.movementX));
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [allowAngle, allowAcc]);

  return { x, y, angle, acceleration };
};
