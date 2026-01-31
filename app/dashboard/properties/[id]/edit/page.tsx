import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { PropertyEditForm } from "../../_components/property-edit-form"

export default async function EditPropertyPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions)

    // Auth Check
    if (!session || !session.user) redirect("/")

    // RBAC: Only POWER_ADMIN
    if ((session.user as any).role !== "POWER_ADMIN") {
        return (
            <div className="p-12 text-center text-red-500">
                <h1 className="text-2xl font-bold">Acceso Restringido</h1>
                <p>Solo Power Admins pueden editar propiedades.</p>
            </div>
        )
    }

    const property = await prisma.property.findUnique({
        where: { id: params.id }
    })

    if (!property) notFound()

    return <PropertyEditForm property={property} />
}
