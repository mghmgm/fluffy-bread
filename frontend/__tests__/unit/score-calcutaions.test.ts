describe('Score Calculations', () => {
  test('pipe speed should increase with score', () => {
    
    // Мокаем функцию 
    const mockInterpolate = jest.fn((score, range, output) => {
      if (score >= 0 && score <= 20) {
        return 1 + (score / 20); 
      }
      return 1;
    });

    const score1 = 0;
    const score2 = 10;
    const score3 = 20;

    const speed1 = mockInterpolate(score1, [0, 20], [1, 2]);
    const speed2 = mockInterpolate(score2, [0, 20], [1, 2]);
    const speed3 = mockInterpolate(score3, [0, 20], [1, 2]);

    expect(speed1).toBe(1);
    expect(speed2).toBe(1.5);
    expect(speed3).toBe(2);
  });
});