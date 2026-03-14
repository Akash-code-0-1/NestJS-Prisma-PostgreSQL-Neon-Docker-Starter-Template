export class RequestMetrics {
  static totalRequests = 0;

  static increment() {
    this.totalRequests++;
  }
}
