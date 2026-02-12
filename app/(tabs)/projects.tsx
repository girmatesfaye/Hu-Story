import { View } from "react-native";
import { AppText } from "../../components/AppText";

export default function ProjectsTabScreen() {
  return (
    <View className="flex-1 bg-white px-5 py-4 dark:bg-slate-950">
      <AppText className="text-slate-900 dark:text-slate-100">
        This is projects tab and thing for git
      </AppText>
    </View>
  );
}
