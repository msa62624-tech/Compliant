/**
 * Sample test file to verify Jest configuration for shared package
 */

describe('Shared Package Tests', () => {
  describe('Type Checking', () => {
    it('should work with type assertions', () => {
      const value: string = 'test';
      expect(typeof value).toBe('string');
    });

    it('should work with number types', () => {
      const num: number = 42;
      expect(typeof num).toBe('number');
      expect(num).toBe(42);
    });
  });

  describe('Array Utilities', () => {
    it('should filter arrays', () => {
      const numbers = [1, 2, 3, 4, 5];
      const evens = numbers.filter(n => n % 2 === 0);
      expect(evens).toEqual([2, 4]);
    });

    it('should map arrays', () => {
      const numbers = [1, 2, 3];
      const doubled = numbers.map(n => n * 2);
      expect(doubled).toEqual([2, 4, 6]);
    });
  });

  describe('Object Operations', () => {
    it('should merge objects', () => {
      const obj1 = { a: 1 };
      const obj2 = { b: 2 };
      const merged = { ...obj1, ...obj2 };
      expect(merged).toEqual({ a: 1, b: 2 });
    });

    it('should check object keys', () => {
      const obj = { name: 'test', value: 123 };
      const keys = Object.keys(obj);
      expect(keys).toEqual(['name', 'value']);
    });
  });
});
