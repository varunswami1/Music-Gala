// Shared, non-reactive "departure" state: while a room is being left, the camera of that room flies forward (into the gate
// you clicked, or straight ahead) before the screen goes black. Driven by tunnel.tsx, read by the room cameras. Owner: Person 3.
export const travel = {
  t: 0,                                           // 0..1 progress of the flight
  target: null as [number, number, number] | null, // where the camera should end up (gate); null = just push forward
  look: null as [number, number, number] | null,   // what it should look at at the end
};
export const easeIn = (t: number) => t * t;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
