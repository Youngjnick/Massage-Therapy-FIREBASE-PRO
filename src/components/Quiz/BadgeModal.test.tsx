import React from 'react';
import { render } from '@testing-library/react';
import BadgeModal from './BadgeModal';

describe('BadgeModal', () => {
  it('renders without crashing', () => {
    render(
      <BadgeModal
        open={true}
        onClose={() => {}}
        badge={{
          id: 'test-id',
          name: 'Test Badge',
          image: 'test.png',
          description: 'A test badge.',
          criteria: 'Test criteria',
          awarded: false
        }}
      />
    );
  });
});