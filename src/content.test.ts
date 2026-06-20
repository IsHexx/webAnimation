import { describe, expect, it } from 'vitest';
import { landingContent } from './content';

describe('landingContent', () => {
  it('positions the page as a personal AI visual IP', () => {
    expect(landingContent.brand.name).toBe('镜澜映画');
    expect(landingContent.hero.title).toContain('AI 角色动画');
    expect(landingContent.hero.primaryAction).toBe('预约制作咨询');
  });

  it('defines the six promotion sections needed for a real service page', () => {
    expect(landingContent.scrollStory).toHaveLength(4);
    expect(landingContent.problems).toHaveLength(3);
    expect(landingContent.services).toHaveLength(4);
    expect(landingContent.audiences).toHaveLength(4);
    expect(landingContent.process).toHaveLength(4);
    expect(landingContent.finalCta.title).toContain('真正的登场');
  });
});
