import { useEffect, useRef } from 'react';

export function useRenderCount() {
  const count = useRef(1);
  useEffect(() => {
    count.current += 1;
  });
  return count.current;
}

export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef(props);
  useEffect(() => {
    const allKeys = Object.keys({ ...previousProps.current, ...props });
    const changesObj: Record<string, { from: any; to: any }> = {};
    allKeys.forEach(key => {
      if (previousProps.current[key] !== props[key]) {
        changesObj[key] = {
          from: previousProps.current[key],
          to: props[key],
        };
      }
    });
    if (Object.keys(changesObj).length) {
      // eslint-disable-next-line no-console
      console.log('[why-did-you-update]', name, changesObj);
    }
    previousProps.current = props;
  });
}
