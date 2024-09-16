import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";

const CitiesDialog = () => (
  <Dialog.Root open={true}>
    <Dialog.Trigger asChild>
      <button className="text-white inline-flex items-center justify-center rounded-full border border-white py-3 bg-black px-4 font-medium leading-none  focus:outline-none">
        Edit Cities
      </button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="bg-black data-[state=open]:animate-overlayShow fixed inset-0" />
      <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 focus:outline-none">
        <Dialog.Title className="text-black m-0 text-lg font-medium">
          Edit profile
        </Dialog.Title>
        <Dialog.Description className="text-black mt-2 mb-5 text-sm leading-normal">
          Make changes to your profile here. Click save when you're done.
        </Dialog.Description>

        <div className="mt-6 flex justify-end">
          <Dialog.Close asChild>
            <button className="bg-gray-200 text-black inline-flex py-3 items-center justify-center rounded-full px-4 font-medium leading-none focus:outline-none">
              Save changes
            </button>
          </Dialog.Close>
        </div>
        <Dialog.Close asChild>
          <button
            className="text-black hover:bg-gray-200 absolute top-2 right-2 inline-flex h-6 w-6 appearance-none items-center justify-center rounded-full  focus:outline-none"
            aria-label="Close"
          >
            <Cross2Icon />
          </button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

export default CitiesDialog;
