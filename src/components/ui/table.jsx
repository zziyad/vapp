'use client'

export function Table({ children }) { return <table className="w-full text-sm">{children}</table> }
export function TableHeader({ children }) { return <thead className="bg-gray-50">{children}</thead> }
export function TableBody({ children }) { return <tbody>{children}</tbody> }
export function TableRow({ children, ...props }) { return <tr {...props}>{children}</tr> }
export function TableHead({ children }) { return <th className="text-left px-4 py-2">{children}</th> }
export function TableCell({ children, ...props }) { return <td className="px-4 py-2" {...props}>{children}</td> }

export default { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
