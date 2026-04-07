"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DeleteSliceDialog({
  open,
  onOpenChange,
  isQuote,
  childCount,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isQuote: boolean;
  childCount: number;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-stone-50 border-stone-200 max-w-sm mx-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-sans text-sm text-stone-800">
            {isQuote ? "引用を削除" : "削除"}
          </AlertDialogTitle>
          <AlertDialogDescription className="font-sans text-xs text-stone-400 leading-relaxed">
            {isQuote && childCount > 0
              ? `この引用を削除すると、紐づいている${childCount}件の内省は独立した記録として残ります。`
              : childCount > 0
                ? `この本と${childCount}件の記録がすべて削除されます。`
                : "この操作は取り消せません。"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-sans text-xs tracking-widest text-stone-400 border-stone-200">
            やめる
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="font-sans text-xs tracking-widest bg-stone-800 text-stone-50 hover:bg-stone-700"
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
