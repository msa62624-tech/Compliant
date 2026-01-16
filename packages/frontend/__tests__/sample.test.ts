/**
 * Sample test file to verify Jest configuration for frontend
 */

describe('Sample Frontend Test Suite', () => {
  describe('Basic Utilities', () => {
    it('should perform basic assertions', () => {
      expect(true).toBe(true);
    });

    it('should work with arrays', () => {
      const items = ['item1', 'item2', 'item3'];
      expect(items).toHaveLength(3);
      expect(items).toContain('item2');
    });

    it('should work with objects', () => {
      const user = { name: 'John', age: 30 };
      expect(user).toHaveProperty('name');
      expect(user.name).toBe('John');
    });
  });

  describe('String Manipulation', () => {
    it('should uppercase strings', () => {
      const text = 'hello';
      expect(text.toUpperCase()).toBe('HELLO');
    });

    it('should trim whitespace', () => {
      const text = '  test  ';
      expect(text.trim()).toBe('test');
    });
  });

  describe('Number Operations', () => {
    it('should compare numbers', () => {
      expect(10).toBeGreaterThan(5);
      expect(3).toBeLessThan(5);
    });

    it('should handle floating point', () => {
      const value = 0.1 + 0.2;
      expect(value).toBeCloseTo(0.3);
    });
  });
});
