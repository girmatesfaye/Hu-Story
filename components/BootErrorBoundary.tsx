import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { AppText } from "./AppText";
import {
  captureBootError,
  getBootDiagnosticsState,
  markBootStage,
} from "../lib/bootDiagnostics";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage: string;
};

export class BootErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    errorMessage: "",
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: `${error.name}: ${error.message}`,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureBootError("RootNavigator", error);
    markBootStage("ROOT_CRASH", {
      componentStack: info.componentStack?.slice(0, 800),
    });
  }

  private handleRetry = () => {
    markBootStage("ROOT_CRASH_RETRY");
    this.setState({
      hasError: false,
      errorMessage: "",
    });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const snapshot = getBootDiagnosticsState();

    return (
      <View className="flex-1 items-center justify-center bg-red-50 px-5 dark:bg-slate-950">
        <View className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-4 dark:border-red-900/40 dark:bg-slate-900">
          <AppText className="text-lg font-semibold text-red-700 dark:text-red-400">
            Startup crashed before app could render.
          </AppText>
          <AppText className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {this.state.errorMessage || "Unknown crash"}
          </AppText>
          <AppText className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            stage={snapshot.stage} route={snapshot.routePath ?? "(none)"}{" "}
            authLoading={String(snapshot.authLoading)}
          </AppText>
          {snapshot.errorMessage ? (
            <AppText className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              captured={snapshot.errorMessage}
            </AppText>
          ) : null}
          <ScrollView className="mt-3 max-h-32 rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
            <AppText className="text-[11px] text-slate-700 dark:text-slate-300">
              {snapshot.events.join("\n") || "No timeline events recorded"}
            </AppText>
          </ScrollView>
          <Pressable
            onPress={this.handleRetry}
            className="mt-4 items-center rounded-lg bg-red-600 px-4 py-3"
          >
            <AppText className="text-sm font-semibold text-white">
              Try Render Again
            </AppText>
          </Pressable>
        </View>
      </View>
    );
  }
}
