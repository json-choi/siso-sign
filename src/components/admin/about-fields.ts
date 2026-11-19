export const ABOUT_DEFAULTS: Record<string, string> = {
  about_title: 'About Us',
  about_description_1: '우리는 독창적인 디지털 경험을 창조하는 크리에이티브 스튜디오입니다...',
  about_description_2: '혁신과 탁월한 디자인을 바탕으로...',
  about_image_url: '',
  about_value_1_title: '진심',
  about_value_1_subtitle: 'Sincerity',
  about_value_1_icon: 'Heart',
  about_value_2_title: '정확',
  about_value_2_subtitle: 'Accuracy',
  about_value_2_icon: 'Target',
  about_value_3_title: '안목',
  about_value_3_subtitle: 'Insight',
  about_value_3_icon: 'Eye',
  about_value_4_title: '완벽',
  about_value_4_subtitle: 'Perfection',
  about_value_4_icon: 'CircleCheck',
};

/** Keys edited on the About page; other about_ keys stay on the settings page. */
export const ABOUT_KEYS = new Set(Object.keys(ABOUT_DEFAULTS));
