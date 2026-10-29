// Keep every simulated position visible. The original uses real physics hit
// stop; picture-only holds let the bodies advance invisibly and then jump.
// Contact bursts, dust and a short renderer shake now provide emphasis without
// skipping a frame or changing physics / record timing.
export class ImpactPresentation {
  constructor() { this.until = 0; }
  hit() { this.until = 0; }
  shouldDraw() { return true; }
  clear() { this.until = 0; }
}
