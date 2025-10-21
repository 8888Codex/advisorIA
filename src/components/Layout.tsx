import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Toaster } from "@/components/ui/sonner";

export function Layout() {
  return (
    <div className="h-screen flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel
          defaultSize={20}
          minSize={15}
          maxSize={25}
          className="hidden md:block"
        >
          <Sidebar />
        </ResizablePanel>
        <ResizableHandle withHandle className="hidden md:flex" />
        <ResizablePanel defaultSize={80}>
          <main className="h-full overflow-y-auto p-4 md:p-8">
            <Outlet />
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
      <Toaster />
    </div>
  );
}