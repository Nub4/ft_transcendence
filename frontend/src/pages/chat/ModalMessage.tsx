import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

interface prop {
	message: string,
	success: boolean,
}

function ModalMessage(prop:prop) {
  const [show, setShow] = useState(true);

  const handleClose = () => setShow(false);

  return (
    <>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          {prop.success && <Modal.Title>Success</Modal.Title>}
          {!prop.success && <Modal.Title>Failure</Modal.Title>}
        </Modal.Header>
        <Modal.Body>{prop.message}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Return
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ModalMessage