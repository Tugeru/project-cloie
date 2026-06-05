import "@testing-library/jest-dom";

const RealDate = global.Date;
const mockTime = new RealDate("2026-05-10T00:00:00.000Z").getTime();

// @ts-expect-error Overriding global Date with mocked default constructor
global.Date = class extends RealDate {
  constructor(...args: ConstructorParameters<typeof RealDate>) {
    if (args[0] === undefined) {
      super(mockTime);
    } else {
      super(...args);
    }
  }

  static now() {
    return mockTime;
  }
};

// Copy static methods
Object.getOwnPropertyNames(RealDate).forEach((prop) => {
  if (prop !== "now" && prop !== "length" && prop !== "name" && prop !== "prototype") {
    // @ts-expect-error Copying static methods
    global.Date[prop] = (RealDate as Record<string, unknown>)[prop];
  }
});
