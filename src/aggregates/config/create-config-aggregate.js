import { createSectorModule } from './modules/create-sector-module'
import { createFunctionalAreaModule } from './modules/create-functional-area-module'
import { createVehicleTypeModule } from './modules/create-vehicle-type-module'
import { createAccessZoneModule } from './modules/create-access-zone-module'
import { createAccessTypeModule } from './modules/create-access-type-module'
import { createValidityModule } from './modules/create-validity-module'
import { createImportanceModule } from './modules/create-importance-module'
import { createPermitTypeModule } from './modules/create-permit-type-module'
import { createPermitTypeSubtypeModule } from './modules/create-permit-type-subtype-module'
import { createSerialNumberModule } from './modules/create-serial-number-module'
import { createEventBus } from '@/lib/aggregates/event-bus'

export function createConfigAggregate(eventId, client, options = {}) {
  const eventBus = createEventBus()
  
  const sector = createSectorModule(client, eventBus)
  const functionalArea = createFunctionalAreaModule(client, eventBus)
  const vehicleType = createVehicleTypeModule(client, eventBus)
  const accessZone = createAccessZoneModule(client, eventBus)
  const accessType = createAccessTypeModule(client, eventBus)
  const validity = createValidityModule(client, eventBus)
  const importance = createImportanceModule(client, eventBus)
  const permitType = createPermitTypeModule(client, eventBus)
  const permitTypeSubtype = createPermitTypeSubtypeModule(client, eventBus)
  const serialNumber = createSerialNumberModule(client, eventBus)

  return {
    eventId,
    sector,
    functionalArea,
    vehicleType,
    accessZone,
    accessType,
    validity,
    importance,
    permitType,
    permitTypeSubtype,
    serialNumber,
    eventBus,
  }
}
