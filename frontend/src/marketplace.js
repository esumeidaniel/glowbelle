function serviceKeys(service) {
  return new Set([service?._id, service?.id, service?.code].filter(Boolean).map(String));
}

export function offeringForService(stylist, service) {
  if (!stylist || !service) return null;
  const keys = serviceKeys(service);
  return (stylist.offerings || []).find(item => {
    if (item.isActive === false) return false;
    const linked = item.service;
    return keys.has(String(linked?._id || linked)) || keys.has(String(linked?.code));
  }) || null;
}

export function providerCountForService(service, stylists = []) {
  return stylists.filter(stylist => stylist.available !== false && offeringForService(stylist, service)).length;
}

export function primaryOfferingForService(service, stylists = []) {
  return stylists
    .filter(stylist => stylist.available !== false)
    .map(stylist => ({ stylist, offering: offeringForService(stylist, service) }))
    .filter(item => item.offering)
    .sort((a, b) => Number(a.offering.price || 0) - Number(b.offering.price || 0))[0] || null;
}

export function attachProviderCounts(services = [], stylists = []) {
  return services.map(service => {
    const primary = primaryOfferingForService(service, stylists);
    return {
      ...service,
      providerCount: providerCountForService(service, stylists),
      primaryOffering: primary?.offering,
      primaryStylist: primary?.stylist,
      displayImageUrl: primary?.offering?.imageUrl || service.imageUrl || '',
      displayPrice: primary?.offering?.price ?? service.price,
      displayDurationMinutes: primary?.offering?.durationMinutes ?? service.durationMinutes,
    };
  });
}
