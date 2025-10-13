// Мокаем функцию
const isBirdCollidingWithRect = (bird, rect) => {
  return (
    bird.x < rect.x + rect.w &&
    bird.x + bird.width > rect.x &&
    bird.y < rect.y + rect.h &&
    bird.y + bird.height > rect.y
  );
};

describe('Collision Detection', () => {
  test('should detect collision when rectangles overlap', () => {
    const bird = { x: 10, y: 10, width: 20, height: 20 };
    const rect = { x: 15, y: 15, w: 20, h: 20 };

    const result = isBirdCollidingWithRect(bird, rect);
    expect(result).toBe(true);
  });

  test('should not detect collision when rectangles are separate', () => {
    const bird = { x: 10, y: 10, width: 20, height: 20 };
    const rect = { x: 50, y: 50, w: 20, h: 20 };

    const result = isBirdCollidingWithRect(bird, rect);
    expect(result).toBe(false);
  });

  test('should handle edge touching as collision', () => {
    const bird = { x: 10, y: 10, width: 20, height: 20 };
    const rect = { x: 30, y: 30, w: 20, h: 20 };

    const result = isBirdCollidingWithRect(bird, rect);
    expect(result).toBe(true);
  });

  test('should not detect collision when completely separate', () => {
    const bird = { x: 10, y: 10, width: 20, height: 20 };
    const rect = { x: 100, y: 100, w: 20, h: 20 };

    const result = isBirdCollidingWithRect(bird, rect);
    expect(result).toBe(false);
  });
});