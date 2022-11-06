import React from "react";
import styled from "styled-components";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
};

const Modal = (props: ModalProps) => {
  const { open, onClose, children } = props;

  const modalRef = React.useRef<HTMLDivElement | null>(null);

  // useKeyPress("Escape", onClose);

  if (!open) return null;
  return (
    <React.Fragment>
      <Overlay onClick={onClose} tabIndex={-1} />
      <Dialog
        {...props}
        ref={modalRef}
        role="dialog"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <DialogTitle id="dialog-title">Modal</DialogTitle>
        <DialogDescription id="dialog-description">Modal</DialogDescription>
        {children}
      </Dialog>
    </React.Fragment>
  );
};

const Dialog = styled.div`
  top: 50%;
  left: 50%;
  border: 1px solid ${({ theme }) => theme.color.grey};
  z-index: 100;
  overflow: hidden;
  position: fixed;
  transform: translateX(-50%) translateY(-50%);
  background: black;
  border-radius: 4px;
`;
const Overlay = styled.div`
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 30;
  position: fixed;
  padding-top: 80px;
`;
const DialogTitle = styled.div`
  left: 0;
  width: 0;
  height: 0;
  position: absolute;
  visibility: hidden;
`;
const DialogDescription = styled.div`
  left: 0;
  width: 0;
  height: 0;
  position: absolute;
  visibility: hidden;
`;

export { Modal };
export type { ModalProps };
