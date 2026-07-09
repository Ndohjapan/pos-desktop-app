'use client'

import { ImSpinner8 } from 'react-icons/im'

function LoadingState() {
  return (
    <>
      <div className="w-full mt-44 md:mt-32 flex items-center justify-center">
        <div className="flex justify-center items-center flex-col gap-3">
          <ImSpinner8 className="animate-spin text-5xl text-primary-700" />
        </div>
      </div>
    </>
  )
}

export default LoadingState
