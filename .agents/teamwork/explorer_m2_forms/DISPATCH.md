## 2026-11-11T08:44:35Z
You are the M2 Forms Explorer for Milestone 2: Shared UI Components and Application Layout Shell.
Read ORIGINAL_REQUEST.md at: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md
Read DESIGN_SYSTEM.md at: d:\Sana Soft2\PRoject Code\PPE-FINAL\DESIGN_SYSTEM.md
Read PROJECT.md at: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\orchestrator\PROJECT.md
Read Spec Miner handoff at: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\spec_miner_design_system\handoff.md
Read Views Explorer handoff at: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_views\handoff.md

Your task is to prepare the exact architecture and implementation guide for Shared Form Controls and Feedback Components in `src/components/ui/` and `src/lib/`:
1. Form Controls:
   - `Input.tsx`: Height `40px` (`h-[40px]`), `rounded-xl`, border `#E2E8F0` (dark: `#17263c`), background `#FFFFFF` (dark: `#121e32`), placeholder `#B0BEC5`, label, asterisk for required, helperText, error state with Lucide `AlertCircle` icon, clear button, password visibility toggle with RTL placement fix.
   - `Textarea.tsx`: Multi-line text input with character counter, `rounded-xl`, dark mode surfaces.
   - `Select.tsx`: Mantine Select wrapper matching HSE tokens, clearable, searchable, with RTL chevron placement.
   - `ToggleSwitch.tsx`: Toggle switch with fixed RTL translation (no hardcoded translate-x that inverts in Arabic), supporting sizes and custom labels.
   - `CheckboxCard.tsx` and `RadioCards.tsx`: Interactive selectable cards with checkmark indicator, active primary border `#212B59`, title, description, and badge.
   - `DatePicker.tsx`: Flatpickr date/time picker wrapper supporting single, range, and datetime modes with Lucide `Calendar` adornment and Arabic/English locale support.
   - `FileUpload.tsx`: Drag-and-drop file upload dropzone with preview, file size/type validation, upload progress, and remove action.
2. Feedback & Overlays:
   - `src/lib/swal.ts` & `useSwal`: SweetAlert2 custom styled wrapper for:
     * `showConfirm(title, text, confirmText)` -> Promise<boolean>
     * `showDeleteReason(title, placeholder)` -> Promise<string | null> (for mandatory deletion/in-use override reasons)
     * `showToast(title, icon)` -> glassmorphic toast notification
   - `Modal.tsx`: Mantine Modal wrapper with header, body, footer, smooth transitions, and RTL close button alignment.
   - `SlideOverDrawer.tsx`: Bidirectional slide-over drawer fixing the current hardcoded `right-0` (in RTL it must slide from the left: `ltr:right-0 rtl:left-0`).

Provide complete, ready-to-implement TypeScript code blocks with all styling and props definitions.
Output path: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m2_forms\handoff.md
Update your progress in: d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m2_forms\progress.md
Send a message when you are done.
