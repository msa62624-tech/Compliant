/**
 * Sample test file to verify Jest configuration
 */

describe('Sample Test Suite', () => {
  describe('Basic Math Operations', () => {
    it('should add two numbers correctly', () => {
      const result = 2 + 2;
      expect(result).toBe(4);
    });

    it('should multiply two numbers correctly', () => {
      const result = 3 * 4;
      expect(result).toBe(12);
    });
  });

  describe('String Operations', () => {
    it('should concatenate strings', () => {
      const result = 'Hello' + ' ' + 'World';
      expect(result).toBe('Hello World');
    });

    it('should check string length', () => {
      const str = 'test';
      expect(str.length).toBe(4);
    });
  });

  describe('Array Operations', () => {
    it('should check if array contains an element', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(arr).toContain(3);
    });

    it('should have correct array length', () => {
      const arr = ['a', 'b', 'c'];
      expect(arr).toHaveLength(3);
    });
  });
});
