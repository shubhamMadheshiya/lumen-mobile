jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('lucide-react-native', () => {
  const React = require('react');
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        return function MockIcon(props) {
          return React.createElement('MockIcon-' + String(prop), props);
        };
      },
    }
  );
});
