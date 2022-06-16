export interface ExecutionOutput {
  status: number // 0 if correct and >0 if error
  errorMessage?: string // error message if any
  results?: string | string[] // list of output resulted after to execute a command
}
