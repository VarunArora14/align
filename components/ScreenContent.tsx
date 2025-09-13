import { Text, View } from 'react-native';

import { EditScreenInfo } from './EditScreenInfo';

type ScreenContentProps = {
  title: string;
  path: string;
  children?: React.ReactNode;
};

export const ScreenContent = ({ title, path, children }: ScreenContentProps) => {
  return (
    <View className={styles.container}>
      <Text className={styles.title}>{title}</Text>
      <View className={styles.separator} />
      {children}
    </View>
  );
};
const styles = {
  container: `flex-1 bg-gray-100`,
  separator: `h-[1px] my-4 w-full bg-gray-200`,
  title: `text-2xl font-bold text-center py-4 bg-white`,
};
