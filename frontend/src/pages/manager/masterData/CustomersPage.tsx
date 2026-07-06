import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { masterDataApi } from '../../../api/masterDataApi'
import type { CreateCustomerDto, CustomerDto } from '../../../types'
import { Errorable } from '../common/Errorable'
import {
  MasterDataFilters,
  MasterDataListState,
  MasterDataListSummary,
  archiveStatusLabel,
  customerNameById,
  masterDataRequestErrorMessage,
  matchesArchiveFilter,
  matchesTextSearch,
  useScrollToError,
  type ArchiveFilter
} from './masterDataShared'
import {
  activeOrSelected,
  compactListField,
  compactListStackedField,
  confirmArchiveAction,
  customerBillingAddress,
  emptyCustomerDraft,
  fallbackText,
  hasRequiredText
} from './masterDataPageUtils'

export function CustomersPage() {
  const [editorOpen, setEditorOpen] = useState(true)
  const [items, setItems] = useState<CustomerDto[]>([])
  const [draft, setDraft] = useState<CreateCustomerDto>(emptyCustomerDraft)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('all')

  const billingPartyOptions = useMemo(
    () => activeOrSelected(items, [draft.billingPartyCustomerId]),
    [items, draft.billingPartyCustomerId]
  )

  useScrollToError(error)

  const load = () => {
    setIsLoading(true)
    return masterDataApi
      .listCustomers()
      .then((customerList) => {
        setItems(customerList)
        setEditorOpen(customerList.length === 0)
      })
      .catch(() => setError('Unable to load customers.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  const filteredItems = useMemo(
    () => items.filter((x) =>
      matchesArchiveFilter(archiveFilter, x.isArchived) &&
      matchesTextSearch(search, [
        x.name, x.accountNumber, x.contactName, x.email, x.phone,
        customerNameById(items, x.billingPartyCustomerId),
        x.billingAddressLine1, x.billingAddressLine2,
        x.billingCity, x.billingState, x.billingPostalCode
      ])
    ),
    [items, search, archiveFilter]
  )

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!hasRequiredText(draft.name)) { setSuccess(null); return setError('Customer name is required.') }
    try {
      const action = editId ? 'updated' : 'created'
      const customerName = draft.name.trim()
      setError(null); setSuccess(null); setIsSaving(true)
      if (editId) await masterDataApi.updateCustomer(editId, draft)
      else await masterDataApi.createCustomer(draft)
      setDraft(emptyCustomerDraft); setEditId(null); await load()
      setEditorOpen(false)
      setSuccess(`Customer "${customerName}" was ${action}.`)
    } catch (requestError) {
      setSuccess(null)
      setError(masterDataRequestErrorMessage(requestError, 'Unable to save customer.'))
    } finally {
      setIsSaving(false)
    }
  }

  const closeEditor = () => {
    setDraft(emptyCustomerDraft); setEditId(null); setError(null); setSuccess(null); setEditorOpen(false)
  }

  const startEdit = (customer: CustomerDto) => {
    setDraft({
      name: customer.name,
      accountNumber: customer.accountNumber,
      contactName: customer.contactName,
      email: customer.email,
      phone: customer.phone,
      billingPartyCustomerId: customer.billingPartyCustomerId ?? null,
      billingAddressLine1: customer.billingAddressLine1,
      billingAddressLine2: customer.billingAddressLine2,
      billingCity: customer.billingCity,
      billingState: customer.billingState,
      billingPostalCode: customer.billingPostalCode
    })
    setEditId(customer.id); setError(null); setSuccess(null); setEditorOpen(true)
  }

  return (
    <section className="card stack">
      <div className="report-results-heading">
        <div>
          <h2>Customers</h2>
          <p className="muted">{editorOpen ? (editId ? 'Edit customer details.' : 'Create a customer record.') : 'Search and manage customer records.'}</p>
        </div>
        {!editorOpen ? (
          <button type="button" onClick={() => { setDraft(emptyCustomerDraft); setEditId(null); setError(null); setSuccess(null); setEditorOpen(true) }}>
            Create Customer
          </button>
        ) : null}
      </div>
      <Errorable error={error} />
      {success ? <p className="success action-feedback-panel">{success}</p> : null}

      <form onSubmit={save} className="stack" aria-label="customer form" hidden={!editorOpen}>
        <div className="row">
          <label>Name<input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label>Account number<input placeholder="Account number" value={draft.accountNumber ?? ''} onChange={(e) => setDraft({ ...draft, accountNumber: e.target.value })} /></label>
        </div>
        <div className="row">
          <label>Contact name<input placeholder="Contact name" value={draft.contactName ?? ''} onChange={(e) => setDraft({ ...draft, contactName: e.target.value })} /></label>
          <label>Email<input placeholder="Email" value={draft.email ?? ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
          <label>Phone<input placeholder="Phone" value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
        </div>
        <label>Default billing party
          <select value={draft.billingPartyCustomerId ?? ''} onChange={(e) => setDraft({ ...draft, billingPartyCustomerId: e.target.value || null })}>
            <option value="">Bill directly to this customer</option>
            {billingPartyOptions.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
        </label>
        <p className="muted">
          {draft.billingPartyCustomerId
            ? `Invoices will be sent to ${customerNameById(items, draft.billingPartyCustomerId)}.`
            : 'Invoices will be sent to this customer using the address below.'}
        </p>
        {!draft.billingPartyCustomerId ? (
          <>
            <div className="row">
              <label>Billing address<input placeholder="Billing address" value={draft.billingAddressLine1 ?? ''} onChange={(e) => setDraft({ ...draft, billingAddressLine1: e.target.value })} /></label>
              <label>Address line 2<input placeholder="Address line 2" value={draft.billingAddressLine2 ?? ''} onChange={(e) => setDraft({ ...draft, billingAddressLine2: e.target.value })} /></label>
            </div>
            <div className="row">
              <label>City<input placeholder="City" value={draft.billingCity ?? ''} onChange={(e) => setDraft({ ...draft, billingCity: e.target.value })} /></label>
              <label>State<input placeholder="State" value={draft.billingState ?? ''} onChange={(e) => setDraft({ ...draft, billingState: e.target.value })} /></label>
              <label>ZIP / postal code<input placeholder="ZIP / postal code" value={draft.billingPostalCode ?? ''} onChange={(e) => setDraft({ ...draft, billingPostalCode: e.target.value })} /></label>
            </div>
          </>
        ) : null}
        {editId ? <p className="muted">Editing customer. Save changes or return to the customer list.</p> : null}
        <div className="row">
          <button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : (editId ? 'Save Customer' : 'Create Customer')}</button>
          <button type="button" className="secondary-button" onClick={closeEditor}>{editId ? 'Cancel customer edit' : 'Back to customers'}</button>
        </div>
      </form>

      <div className="stack" hidden={editorOpen}>
        <MasterDataFilters
          label="customers"
          search={search}
          searchPlaceholder="Search by name, account, contact, email, phone, or address"
          archiveFilter={archiveFilter}
          onSearchChange={setSearch}
          onArchiveFilterChange={setArchiveFilter}
          onReset={() => { setSearch(''); setArchiveFilter('all') }}
        />
        <MasterDataListSummary loading={isLoading} totalCount={items.length} filteredItems={filteredItems} noun="customers" />
        <MasterDataListState loading={isLoading} totalCount={items.length} filteredCount={filteredItems.length} noun="customers" />
        <ul className="master-data-list compact-master-list customer-list">
          {filteredItems.map((customer) => {
            const billingAddress = customerBillingAddress(customer)
            return (
              <li className="master-data-item compact-master-list-item customer-list-item" key={customer.id}>
                <div className="compact-list-primary">
                  <div className="master-data-title-row">
                    <strong className="master-data-title">{customer.name}</strong>
                    <span className={`status-pill ${customer.isArchived ? 'inactive' : 'active'}`}>{archiveStatusLabel(customer.isArchived)}</span>
                  </div>
                  <span className="customer-list-account">Account: {fallbackText(customer.accountNumber, 'No account')}</span>
                </div>
                {compactListField('Billing party', customer.billingPartyCustomerId ? customerNameById(items, customer.billingPartyCustomerId) : null, 'Bills directly')}
                {compactListField('Contact', customer.contactName)}
                {compactListStackedField('Email / phone', [customer.email || 'No email', customer.phone || 'No phone'])}
                {compactListField('Billing', billingAddress, 'No billing address', 'customer-list-billing compact-list-address')}
                <div className="master-data-actions compact-list-actions">
                  <button type="button" onClick={() => startEdit(customer)}>Edit</button>
                  <button type="button" onClick={async () => {
                    if (!confirmArchiveAction('customer', customer.name, customer.isArchived)) return
                    const action = customer.isArchived ? 'unarchived' : 'archived'
                    try {
                      setError(null); setSuccess(null)
                      if (customer.isArchived) await masterDataApi.unarchiveCustomer(customer.id)
                      else await masterDataApi.archiveCustomer(customer.id)
                      await load()
                      setSuccess(`Customer "${customer.name}" was ${action}.`)
                    } catch {
                      setSuccess(null)
                      setError('Unable to update customer archive state.')
                    }
                  }}>{customer.isArchived ? 'Unarchive' : 'Archive'}</button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
