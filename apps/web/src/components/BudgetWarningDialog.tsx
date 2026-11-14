import { formatUsd, type BudgetStatus } from '@rocket-odyssey/game-core';
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import { ActionButton } from './ActionButton.tsx';
import { FrameBackground } from './Frame.tsx';
import { AlertIcon } from './icons.tsx';

interface BudgetWarningDialogProps {
  isOpen: boolean;
  budget: BudgetStatus;
  /** The player wants to stay and change the design. */
  onReview: () => void;
  /** The player has read the warning and wants to move forward anyway. */
  onContinue: () => void;
}

/**
 * The warning the use case asks for before the player moves forward with a
 * design that costs more than the budget. It does not block: the player may
 * go on and see the consequence at launch.
 */
export function BudgetWarningDialog({
  isOpen,
  budget,
  onReview,
  onContinue,
}: BudgetWarningDialogProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onReview();
      }}
      isDismissable
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-space-950/85 p-4"
    >
      <Modal className="w-full max-w-lg">
        <Dialog role="alertdialog" className="frame frame--bad p-6 outline-none sm:p-8">
          <FrameBackground />
          <Heading slot="title" className="display flex items-center gap-3 text-2xl text-stop">
            <AlertIcon width="1.4em" height="1.4em" />
            Over budget
          </Heading>
          <p className="mt-4 text-lg text-ink">
            This design costs <strong className="value">{formatUsd(budget.spentUsd)}</strong>, which
            is <strong className="text-stop">{formatUsd(-budget.remainingUsd)}</strong> more than the{' '}
            {formatUsd(budget.maxUsd)} the client can pay.
          </p>
          <p className="mt-3 text-ink-soft">
            The agency will not fund a mission that costs more than its budget. You can keep
            planning, but the launch will be scrubbed unless you pick a cheaper rocket or a lighter
            payload.
          </p>
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <ActionButton variant="secondary" onPress={onContinue}>
              Continue anyway
            </ActionButton>
            <ActionButton variant="primary" onPress={onReview} autoFocus>
              Review my choices
            </ActionButton>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
